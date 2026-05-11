"""
Celery application factory.
Uses Redis as both broker and result backend (configurable via .env).
"""
from __future__ import annotations

from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "code_review_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,                   # ACK only after task completes
    worker_prefetch_multiplier=1,          # One task per worker at a time
    task_soft_time_limit=settings.AGENT_TIMEOUT + 30,
    task_time_limit=settings.AGENT_TIMEOUT + 60,
    result_expires=3600,
    broker_connection_retry_on_startup=True,
)
