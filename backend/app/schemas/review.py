from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Any, Dict
from app.models.review import ReviewStatus
from app.models.review_iteration import IterationDecision

class ReviewBase(BaseModel):
    repository: str
    branch: str
    pull_request_number: int | None = None

class ReviewCreate(ReviewBase):
    code_snippet: str | None = None # For manual testing without PR
    error_description: str | None = None # Explicit issue to fix

class ReviewIterationResponse(BaseModel):
    id: UUID
    iteration_number: int
    proposer_output: Dict[str, Any] | None
    critic_output: Dict[str, Any] | None
    evaluator_output: Dict[str, Any] | None
    decision: IterationDecision
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ReviewResponse(ReviewBase):
    id: UUID
    user_id: UUID
    status: ReviewStatus
    created_at: datetime
    updated_at: datetime
    iterations: List[ReviewIterationResponse] = []

    model_config = ConfigDict(from_attributes=True)
