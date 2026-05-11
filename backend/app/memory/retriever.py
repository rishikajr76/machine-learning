"""
Memory retriever service — stores and retrieves code-review lessons
in/from ChromaDB using semantic similarity.
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from app.memory.chroma_client import chroma_client
from app.memory.embeddings import embeddings_service
from app.core.logging import get_logger

logger = get_logger(__name__)


class MemoryService:
    """
    Provides:
      - `store_lesson()`: embed a lesson and upsert into ChromaDB
      - `retrieve_similar()`: k-NN search for context-aware prompt augmentation
    """

    # ------------------------------------------------------------------
    # Write path
    # ------------------------------------------------------------------

    async def store_lesson(
        self,
        review_id: str,
        language: str,
        lesson: str,
        quality_score: int = 0,
        verdict: str = "FAIL",
    ) -> None:
        """
        Embed a lesson extracted by the EvaluatorAgent and upsert it into
        the ChromaDB collection.
        """
        if not lesson.strip():
            return

        doc_id = f"lesson-{review_id}"
        embedding = await embeddings_service.embed_one(lesson)

        await chroma_client.upsert(
            ids=[doc_id],
            documents=[lesson],
            embeddings=[embedding],
            metadatas=[{
                "review_id": review_id,
                "language": language,
                "quality_score": quality_score,
                "verdict": verdict,
            }],
        )
        logger.info("Lesson stored in vector memory", review_id=review_id)

    # ------------------------------------------------------------------
    # Read path
    # ------------------------------------------------------------------

    async def retrieve_similar(
        self,
        query: str,
        language: Optional[str] = None,
        n_results: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Return the top-k most similar lessons for use in prompt augmentation.

        Args:
            query: The code snippet or bug description to search with.
            language: Optional language filter (e.g. "python").
            n_results: Number of results to return.

        Returns:
            List of dicts with keys: document, metadata, distance.
        """
        if not query.strip():
            return []

        embedding = await embeddings_service.embed_one(query)

        where_filter: Optional[Dict[str, Any]] = None
        if language:
            where_filter = {"language": {"$eq": language}}

        results = await chroma_client.query(
            query_embeddings=[embedding],
            n_results=n_results,
            where=where_filter,
        )

        output = []
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for doc, meta, dist in zip(documents, metadatas, distances):
            output.append({"document": doc, "metadata": meta, "distance": dist})

        logger.debug("Memory retrieval completed", hits=len(output))
        return output

    async def format_for_prompt(
        self, query: str, language: Optional[str] = None, n_results: int = 3
    ) -> str:
        """Return a formatted string block suitable for injection into agent prompts."""
        lessons = await self.retrieve_similar(query, language=language, n_results=n_results)
        if not lessons:
            return ""

        lines = ["## Relevant past lessons (retrieved from vector memory)\n"]
        for i, lesson in enumerate(lessons, 1):
            score = lesson["metadata"].get("quality_score", "?")
            lang = lesson["metadata"].get("language", "?")
            lines.append(
                f"### Lesson {i} [lang={lang}, quality={score}]\n{lesson['document']}\n"
            )
        return "\n".join(lines)


# Module-level singleton
memory_service = MemoryService()
