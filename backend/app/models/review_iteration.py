from sqlalchemy import ForeignKey, DateTime, Enum as SQLEnum, Integer
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db.base import Base, UUIDMixin
from datetime import datetime
from typing import Any, Dict, TYPE_CHECKING
import enum
import uuid

if TYPE_CHECKING:
    from app.models.review import Review

class IterationDecision(str, enum.Enum):
    APPROVED = "APPROVED"
    NEEDS_REFINEMENT = "NEEDS_REFINEMENT"
    REJECTED = "REJECTED"
    PENDING = "PENDING"

class ReviewIteration(Base, UUIDMixin):
    __tablename__ = "review_iterations"

    review_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("reviews.id", ondelete="CASCADE"), index=True)
    iteration_number: Mapped[int] = mapped_column(Integer, nullable=False)
    
    proposer_output: Mapped[Dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    critic_output: Mapped[Dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    evaluator_output: Mapped[Dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    
    decision: Mapped[IterationDecision] = mapped_column(SQLEnum(IterationDecision), default=IterationDecision.PENDING)
    
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    review: Mapped["Review"] = relationship("Review", back_populates="iterations")
