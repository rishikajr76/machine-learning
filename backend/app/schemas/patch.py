from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class PatchBase(BaseModel):
    file_path: str
    language: str | None = None
    original_code: str
    patched_code: str
    diff: str
    confidence_score: float | None = None

class PatchCreate(PatchBase):
    review_id: UUID

class PatchResponse(PatchBase):
    id: UUID
    review_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
