"""
Celery worker tasks.
All heavy async work is wrapped with asyncio.run() so Celery's sync workers
can drive the async review graph.
"""
from __future__ import annotations

import asyncio
from typing import Optional

from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@shared_task(bind=True, name="tasks.run_review", max_retries=2, default_retry_delay=10)
def run_review_task(self, review_id: str, user_id: str) -> dict:
    """
    Celery task: execute the Critique-and-Refine graph for a given review.

    Args:
        review_id: UUID of the review record.
        user_id: UUID of the requesting user.

    Returns:
        dict with final_verdict and quality_score.
    """
    logger.info(f"[run_review_task] Starting review_id={review_id}")

    try:
        result = asyncio.run(_async_run_review(review_id, user_id))
        logger.info(f"[run_review_task] Completed review_id={review_id} verdict={result.get('final_verdict')}")
        return result
    except Exception as exc:
        logger.exception(f"[run_review_task] Failed review_id={review_id} error={exc}")
        raise self.retry(exc=exc)


async def _async_run_review(review_id: str, user_id: str) -> dict:
    """Async implementation — creates its own DB session and LLM provider."""
    from app.db.session import AsyncSessionFactory
    from app.llm.provider import get_provider
    from app.core.websocket_manager import ws_manager
    from app.memory.retriever import memory_service
    from app.services.review_service import ReviewService

    provider = get_provider()

    async with AsyncSessionFactory() as db:
        svc = ReviewService(
            db=db,
            provider=provider,
            ws_manager=ws_manager,
            memory_service=memory_service,
        )
        review = await svc.run_review(review_id=review_id, user_id=user_id)
        return {
            "review_id": str(review.id),
            "final_verdict": review.final_verdict,
            "quality_score": review.quality_score,
        }


@shared_task(name="tasks.analyze_code_static")
def analyze_code_task(review_id: str, code: str, language: str = "python") -> dict:
    """
    Celery task: run static analysis (pylint/bandit/mypy) on a code snippet.
    Results are logged; future work can persist them to the review record.
    """
    logger.info(f"[analyze_code_task] Starting review_id={review_id}")
    try:
        result = asyncio.run(_async_analyze(code, language))
        logger.info(f"[analyze_code_task] Done, issues={len(result.get('issues', []))}")
        return result
    except Exception as exc:
        logger.exception(f"[analyze_code_task] Failed: {exc}")
        return {"error": str(exc), "issues": []}


async def _async_analyze(code: str, language: str) -> dict:
    from app.analysis.analyzers import analyze_code
    result = await analyze_code(code, language)
    return {
        "success": result.success,
        "issues": [
            {
                "tool": i.tool,
                "severity": i.severity,
                "message": i.message,
                "line": i.line,
                "code": i.code,
            }
            for i in result.issues
        ],
        "error": result.error,
    }
