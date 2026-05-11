from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Dict, Any, Sequence
from app.models.review_iteration import ReviewIteration, IterationDecision

class IterationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_or_update(
        self, 
        review_id: UUID, 
        iteration_number: int,
        proposer_output: Dict[str, Any] | None = None,
        critic_output: Dict[str, Any] | None = None,
        evaluator_output: Dict[str, Any] | None = None,
        decision: IterationDecision | None = None
    ) -> ReviewIteration:
        
        stmt = select(ReviewIteration).where(
            ReviewIteration.review_id == review_id,
            ReviewIteration.iteration_number == iteration_number
        )
        result = await self.session.execute(stmt)
        iteration = result.scalar_one_or_none()

        if not iteration:
            iteration = ReviewIteration(
                review_id=review_id,
                iteration_number=iteration_number
            )
            self.session.add(iteration)

        if proposer_output is not None:
            iteration.proposer_output = proposer_output
        if critic_output is not None:
            iteration.critic_output = critic_output
        if evaluator_output is not None:
            iteration.evaluator_output = evaluator_output
        if decision is not None:
            iteration.decision = decision

        await self.session.commit()
        await self.session.refresh(iteration)
        return iteration

    async def get_iterations_for_review(self, review_id: UUID) -> Sequence[ReviewIteration]:
        stmt = select(ReviewIteration).where(ReviewIteration.review_id == review_id).order_by(ReviewIteration.iteration_number.asc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
