"""
Embeddings service — wraps OpenAI or Google Gemini to produce
dense vector embeddings for ChromaDB storage and retrieval.
"""
from __future__ import annotations

import asyncio
from typing import List, Optional

import openai
import google.generativeai as genai

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()

_OPENAI_MODEL = "text-embedding-3-small"
_OPENAI_DIM = 1536

_GEMINI_MODEL = "models/embedding-001"
_GEMINI_DIM = 768


class EmbeddingsService:
    """
    Produces dense embeddings using either OpenAI or Google Gemini.
    """

    def __init__(self):
        self.provider = settings.DEFAULT_LLM_PROVIDER
        
        # Initialize clients lazily or conditionally
        self._openai_client = None
        if self.provider == "openai" or settings.OPENAI_API_KEY:
            self._openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        if self.provider == "gemini" or settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)

    async def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []

        if self.provider == "gemini":
            return await self._embed_gemini(texts)
        else:
            return await self._embed_openai(texts)

    async def _embed_openai(self, texts: List[str]) -> List[List[float]]:
        safe_texts = [t if t.strip() else " " for t in texts]
        try:
            if not self._openai_client:
                raise ValueError("OpenAI client not initialized (missing API key)")
            
            response = await self._openai_client.embeddings.create(
                model=_OPENAI_MODEL,
                input=safe_texts,
            )
            return [item.embedding for item in response.data]
        except Exception as exc:
            logger.warning("OpenAI Embedding failed — using zero vectors", error=str(exc))
            return [[0.0] * _OPENAI_DIM for _ in texts]

    async def _embed_gemini(self, texts: List[str]) -> List[List[float]]:
        try:
            loop = asyncio.get_event_loop()
            # Batch embedding
            result = await loop.run_in_executor(
                None,
                lambda: genai.embed_content(
                    model=_GEMINI_MODEL,
                    content=texts,
                    task_type="retrieval_document"
                )
            )
            return result['embedding']
        except Exception as exc:
            logger.warning("Gemini Embedding failed — using zero vectors", error=str(exc))
            return [[0.0] * _GEMINI_DIM for _ in texts]

    async def embed_one(self, text: str) -> List[float]:
        results = await self.embed([text])
        return results[0]


# Module-level singleton
embeddings_service = EmbeddingsService()
