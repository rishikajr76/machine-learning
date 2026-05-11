"""
Main API v1 router — aggregates all sub-routers under /api/v1
"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.patches import router as patches_router
from app.api.v1.memory import router as memory_router
from app.api.v1.github import router as github_router
from app.api.v1.ws import router as ws_router

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(reviews_router)
api_router.include_router(patches_router)
api_router.include_router(memory_router)
api_router.include_router(github_router)
api_router.include_router(ws_router)
