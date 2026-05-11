from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class AgentLogCreate(BaseModel):
    review_id: UUID
    agent_name: str
    message: str
    level: str = "INFO"
    correlation_id: str | None = None

class AgentLogResponse(BaseModel):
    id: UUID
    review_id: UUID
    agent_name: str
    message: str
    level: str
    correlation_id: str | None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
