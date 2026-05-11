"""
Review Service — orchestrates the full review lifecycle:
  1. Persist a Review record in Postgres
  2. Run the LangGraph Critique-and-Refine graph
  3. Persist iterations, patches, agent logs back to Postgres
  4. Broadcast real-time events over WebSocket
  5. Store evaluator lessons in ChromaDB
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.review_graph import build_review_graph
from app.agents.graph_state import ReviewGraphState
from app.core.config import get_settings
from app.core.logging import get_logger
from app.db.repositories.review_repo import ReviewRepository
from app.db.repositories.iteration_repo import IterationRepository
from app.db.repositories.agent_log_repo import AgentLogRepository
from app.llm.provider import LLMProvider
from app.schemas.review import ReviewCreate, ReviewRead, ReviewStatus

logger = get_logger(__name__)
settings = get_settings()


class ReviewService:
    """
    High-level service that ties together the LangGraph graph, database
    repositories, WebSocket broadcasting, and vector memory.
    """

    def __init__(
        self,
        db: AsyncSession,
        provider: LLMProvider,
        ws_manager=None,      # injected to avoid circular import
        memory_service=None,  # injected optionally
    ):
        self.db = db
        self.provider = provider
        self.ws_manager = ws_manager
        self.memory_service = memory_service

        self.review_repo = ReviewRepository(db)
        self.iteration_repo = IterationRepository(db)
        self.agent_log_repo = AgentLogRepository(db)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def create_review(
        self,
        user_id: str,
        file_path: str,
        language: str,
        original_code: str,
        context: str = "",
        github_pr_url: Optional[str] = None,
    ) -> ReviewRead:
        """
        Persist a new review record and return its schema.
        The heavy lifting (graph run) is triggered separately via `run_review`.
        """
        review = await self.review_repo.create(
            user_id=user_id,
            file_path=file_path,
            language=language,
            original_code=original_code,
            context=context,
            github_pr_url=github_pr_url,
        )
        logger.info("Review created", review_id=str(review.id), user_id=user_id)
        return ReviewRead.model_validate(review)

    async def run_review(self, review_id: str, user_id: str) -> ReviewRead:
        """
        Execute the Critique-and-Refine graph for an existing review,
        persist all results, and return the final review state.
        """
        review = await self.review_repo.get_or_404(review_id)

        # Mark in-progress
        await self.review_repo.update_status(review_id, ReviewStatus.IN_PROGRESS)
        await self._broadcast(review_id, {"type": "status", "status": "in_progress"})

        # Build initial state
        initial_state: ReviewGraphState = {
            "review_id": review_id,
            "user_id": user_id,
            "file_path": review.file_path,
            "language": review.language,
            "original_code": review.original_code,
            "context": review.context or "",
            "iteration": 1,
            "max_iterations": settings.MAX_REVIEW_ITERATIONS,
            "should_continue": True,
            "proposer_output": {},
            "patched_code": review.original_code,
            "critic_output": {},
            "critic_verdict": "REJECT",
            "evaluator_output": {},
            "final_verdict": "",
            "quality_score": 0,
            "iteration_history": [],
            "websocket_events": [],
            "error": None,
        }

        # Run the graph
        try:
            graph = build_review_graph(self.provider)
            final_state: ReviewGraphState = await graph.ainvoke(initial_state)
        except Exception as exc:
            logger.exception("Graph execution failed", review_id=review_id)
            await self.review_repo.update_status(review_id, ReviewStatus.FAILED)
            await self._broadcast(review_id, {"type": "status", "status": "failed", "error": str(exc)})
            raise

        # Broadcast all queued events
        for event in final_state.get("websocket_events", []):
            await self._broadcast(review_id, event)

        # Persist each iteration
        for record in final_state.get("iteration_history", []):
            await self.iteration_repo.create(
                review_id=review_id,
                iteration_number=record["iteration"],
                patched_code=record["patched_code"],
                proposer_output=record["proposer_output"],
                critic_output=record["critic_output"],
                critic_verdict=record["critic_verdict"],
            )

        # Persist final patch
        final_verdict = final_state.get("final_verdict", "FAIL")
        quality_score = final_state.get("quality_score", 0)
        patched_code = final_state.get("patched_code", "")
        evaluator_output = final_state.get("evaluator_output", {})

        await self.review_repo.update_final(
            review_id=review_id,
            final_verdict=final_verdict,
            quality_score=quality_score,
            patched_code=patched_code,
            evaluator_output=evaluator_output,
            status=ReviewStatus.COMPLETED,
        )

        # Store lesson in vector memory
        if self.memory_service and evaluator_output.get("lesson"):
            await self._store_lesson(review, evaluator_output, final_state)

        await self._broadcast(review_id, {
            "type": "status",
            "status": "completed",
            "final_verdict": final_verdict,
            "quality_score": quality_score,
        })

        updated = await self.review_repo.get_or_404(review_id)
        return ReviewRead.model_validate(updated)

    async def get_review(self, review_id: str) -> ReviewRead:
        review = await self.review_repo.get_or_404(review_id)
        return ReviewRead.model_validate(review)

    async def list_reviews(self, user_id: str, skip: int = 0, limit: int = 20):
        reviews = await self.review_repo.list_by_user(user_id, skip=skip, limit=limit)
        return [ReviewRead.model_validate(r) for r in reviews]

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _broadcast(self, review_id: str, event: Dict[str, Any]) -> None:
        if self.ws_manager:
            try:
                await self.ws_manager.broadcast(review_id, event)
            except Exception:
                pass  # non-fatal

    async def _store_lesson(self, review, evaluator_output, final_state) -> None:
        try:
            await self.memory_service.store_lesson(
                review_id=str(review.id),
                language=review.language,
                lesson=evaluator_output["lesson"],
                quality_score=final_state.get("quality_score", 0),
                verdict=final_state.get("final_verdict", "FAIL"),
            )
        except Exception as exc:
            logger.warning("Failed to store lesson in vector memory", error=str(exc))
