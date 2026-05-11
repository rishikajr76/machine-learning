"""
WebSocket API endpoint.
Clients subscribe to live review events by connecting to:
    ws://<host>/api/v1/ws/{review_id}?token=<jwt>
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, Query, HTTPException, status

from app.core.security import decode_access_token
from app.core.websocket_manager import ws_manager
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/ws", tags=["WebSocket"])


async def _get_ws_user(token: str = Query(..., description="JWT access token")):
    """Authenticate WebSocket upgrade via query-param token."""
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or expired token",
        )
    return payload.get("sub")


@router.websocket("/{review_id}")
async def review_stream(
    review_id: str,
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    Subscribe to live Critique-and-Refine events for a given review.

    Event shape:
        { "type": "propose" | "critique" | "evaluate" | "status", ...payload }
    """
    # Authenticate
    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001)
        return

    user_id = payload.get("sub")
    logger.info("WebSocket client connecting", review_id=review_id, user_id=user_id)

    await ws_manager.connect(review_id, websocket)

    try:
        # Keep the connection alive; client can send pings
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await ws_manager.send_personal(websocket, {"type": "pong"})
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected", review_id=review_id, user_id=user_id)
    finally:
        await ws_manager.disconnect(review_id, websocket)
