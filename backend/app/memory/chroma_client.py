"""
ChromaDB async client wrapper.
Provides a thin async interface over the synchronous chromadb SDK
by offloading blocking calls to a thread pool.
"""
from __future__ import annotations

import asyncio
from functools import partial
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger(__name__)
settings = get_settings()


class ChromaClient:
    """
    Async wrapper around the chromadb HTTP client.
    All blocking SDK calls are executed in the default executor thread pool.
    """

    def __init__(self):
        self._client: Optional[chromadb.HttpClient] = None
        self._collection = None
        self._collection_name = settings.CHROMA_COLLECTION

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self) -> None:
        """Initialise the client and ensure the collection exists."""
        loop = asyncio.get_event_loop()
        self._client = await loop.run_in_executor(
            None,
            partial(
                chromadb.HttpClient,
                host=settings.CHROMA_HOST,
                port=settings.CHROMA_PORT,
                settings=ChromaSettings(anonymized_telemetry=False),
            ),
        )
        self._collection = await loop.run_in_executor(
            None,
            partial(
                self._client.get_or_create_collection,
                name=self._collection_name,
                metadata={"hnsw:space": "cosine"},
            ),
        )
        logger.info(
            "ChromaDB connected",
            host=settings.CHROMA_HOST,
            port=settings.CHROMA_PORT,
            collection=self._collection_name,
        )

    async def disconnect(self) -> None:
        self._client = None
        self._collection = None
        logger.info("ChromaDB disconnected")

    # ------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------

    async def upsert(
        self,
        ids: List[str],
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: Optional[List[Dict[str, Any]]] = None,
    ) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            partial(
                self._collection.upsert,
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas or [{} for _ in ids],
            ),
        )

    async def query(
        self,
        query_embeddings: List[List[float]],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        loop = asyncio.get_event_loop()
        kwargs: Dict[str, Any] = {
            "query_embeddings": query_embeddings,
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        result = await loop.run_in_executor(
            None,
            partial(self._collection.query, **kwargs),
        )
        return result

    async def delete(self, ids: List[str]) -> None:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, partial(self._collection.delete, ids=ids))

    async def count(self) -> int:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._collection.count)


# Module-level singleton
chroma_client = ChromaClient()
