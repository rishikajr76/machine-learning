"""
WebSocket connection manager.
Maintains a registry of active connections keyed by review_id,
enabling server-push events during graph execution.
"""
from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from typing import Any, Dict, List, Set

from fastapi import WebSocket
from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """
    Thread-safe WebSocket connection manager.

    Each review can have multiple subscribers (e.g. multiple browser tabs).
    """

    def __init__(self):
        # review_id → set of active WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def connect(self, review_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[review_id].add(websocket)
        logger.info("WebSocket connected", review_id=review_id)

    async def disconnect(self, review_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[review_id].discard(websocket)
            if not self._connections[review_id]:
                del self._connections[review_id]
        logger.info("WebSocket disconnected", review_id=review_id)

    # ------------------------------------------------------------------
    # Broadcasting
    # ------------------------------------------------------------------

    async def broadcast(self, review_id: str, payload: Dict[str, Any]) -> None:
        """Send a JSON payload to all subscribers of a review."""
        message = json.dumps(payload)
        dead: List[WebSocket] = []

        async with self._lock:
            sockets = set(self._connections.get(review_id, set()))

        for ws in sockets:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)

        # Prune dead connections
        if dead:
            async with self._lock:
                for ws in dead:
                    self._connections[review_id].discard(ws)

    async def send_personal(self, websocket: WebSocket, payload: Dict[str, Any]) -> None:
        """Send a message to a single connection."""
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception as exc:
            logger.warning("Failed to send personal WS message", error=str(exc))

    # ------------------------------------------------------------------
    # Introspection
    # ------------------------------------------------------------------

    def subscriber_count(self, review_id: str) -> int:
        return len(self._connections.get(review_id, set()))

    def active_review_ids(self) -> List[str]:
        return list(self._connections.keys())


# Singleton — imported by both the FastAPI app and the review service
ws_manager = ConnectionManager()
