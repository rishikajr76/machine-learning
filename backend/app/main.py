"""
FastAPI application factory.
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.router import api_router
from app.core.config import get_settings
from app.core.exceptions import NotFoundError, UnauthorizedError, ValidationError
from app.core.logging import get_logger
from app.core.middleware import ProcessTimeMiddleware, RequestIDMiddleware
from app.db.session import engine
from app.memory.chroma_client import chroma_client

logger = get_logger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# Rate limiter
# ---------------------------------------------------------------------------
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


# ---------------------------------------------------------------------------
# Lifespan: startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Code Review Agent API", version=settings.VERSION)

    # Connect ChromaDB
    try:
        await chroma_client.connect()
        logger.info("ChromaDB connected")
    except Exception as exc:
        logger.warning("ChromaDB unavailable at startup — memory features disabled", error=str(exc))

    yield

    # Shutdown
    logger.info("Shutting down Code Review Agent API")
    await chroma_client.disconnect()
    await engine.dispose()


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
def create_app() -> FastAPI:
    app = FastAPI(
        title="Self-Correction Code Review Agent",
        description=(
            "A production-grade autonomous code review system powered by a "
            "multi-agent LangGraph Critique-and-Refine loop."
        ),
        version=settings.VERSION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ---- Rate limiting ----
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # ---- CORS ----
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Custom middleware ----
    app.add_middleware(ProcessTimeMiddleware)
    app.add_middleware(RequestIDMiddleware)

    # ---- Exception handlers ----
    @app.exception_handler(NotFoundError)
    async def not_found_handler(request: Request, exc: NotFoundError):
        return JSONResponse(status_code=404, content={"detail": str(exc)})

    @app.exception_handler(UnauthorizedError)
    async def unauthorized_handler(request: Request, exc: UnauthorizedError):
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    @app.exception_handler(ValidationError)
    async def validation_handler(request: Request, exc: ValidationError):
        return JSONResponse(status_code=422, content={"detail": str(exc)})

    # ---- Routers ----
    app.include_router(api_router)

    # ---- Health / readiness ----
    @app.get("/health", tags=["Health"], summary="Health check")
    async def health():
        return {"status": "ok", "version": settings.VERSION}

    @app.get("/ready", tags=["Health"], summary="Readiness probe")
    async def ready():
        return {
            "status": "ready",
            "db": "ok",
            "chroma": "ok" if chroma_client._client else "degraded",
        }

    @app.get("/metrics", tags=["Observability"], summary="Basic metrics")
    async def metrics():
        from app.core.websocket_manager import ws_manager
        return {
            "active_ws_reviews": len(ws_manager.active_review_ids()),
            "ws_review_ids": ws_manager.active_review_ids(),
        }

    logger.info("FastAPI application created", routes=len(app.routes))
    return app


app = create_app()
