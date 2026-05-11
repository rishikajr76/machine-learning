from typing import Any
from sqlalchemy.orm import DeclarativeBase
import uuid
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID

class Base(DeclarativeBase):
    pass

class UUIDMixin:
    """Mixin that adds a UUID primary key to a model."""
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
