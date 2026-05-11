from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Sequence
from app.models.agent_log import AgentLog
from app.schemas.agent import AgentLogCreate

class AgentLogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_review(self, review_id: UUID) -> Sequence[AgentLog]:
        stmt = select(AgentLog).where(AgentLog.review_id == review_id).order_by(AgentLog.timestamp.asc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, log_in: AgentLogCreate) -> AgentLog:
        db_log = AgentLog(
            review_id=log_in.review_id,
            agent_name=log_in.agent_name,
            message=log_in.message,
            level=log_in.level,
            correlation_id=log_in.correlation_id
        )
        self.session.add(db_log)
        await self.session.commit()
        await self.session.refresh(db_log)
        return db_log
