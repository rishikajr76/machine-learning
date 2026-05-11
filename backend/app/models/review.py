from sqlalchemy import String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base, UUIDMixin
from datetime import datetime
from typing import List, TYPE_CHECKING
import enum
import uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.review_iteration import ReviewIteration
    from app.models.patch import Patch
    from app.models.agent_log import AgentLog

class ReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class Review(Base, UUIDMixin):
    __tablename__ = "reviews"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    repository: Mapped[str] = mapped_column(String(255), nullable=False)
    branch: Mapped[str] = mapped_column(String(255), nullable=False)
    pull_request_number: Mapped[int | None] = mapped_column(nullable=True)
    status: Mapped[ReviewStatus] = mapped_column(SQLEnum(ReviewStatus), default=ReviewStatus.PENDING)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="reviews")
    iterations: Mapped[List["ReviewIteration"]] = relationship("ReviewIteration", back_populates="review", cascade="all, delete-orphan")
    patches: Mapped[List["Patch"]] = relationship("Patch", back_populates="review", cascade="all, delete-orphan")
    logs: Mapped[List["AgentLog"]] = relationship("AgentLog", back_populates="review", cascade="all, delete-orphan")
