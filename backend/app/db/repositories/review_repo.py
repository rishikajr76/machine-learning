from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from uuid import UUID
from typing import List, Sequence
from app.models.review import Review, ReviewStatus
from app.schemas.review import ReviewCreate

class ReviewRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, review_id: UUID, load_iterations: bool = True) -> Review | None:
        stmt = select(Review).where(Review.id == review_id)
        if load_iterations:
            stmt = stmt.options(selectinload(Review.iterations))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: UUID) -> Sequence[Review]:
        stmt = select(Review).where(Review.user_id == user_id).order_by(Review.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, user_id: UUID, review_in: ReviewCreate) -> Review:
        db_review = Review(
            user_id=user_id,
            repository=review_in.repository,
            branch=review_in.branch,
            pull_request_number=review_in.pull_request_number,
        )
        self.session.add(db_review)
        await self.session.commit()
        await self.session.refresh(db_review)
        return db_review

    async def update_status(self, review_id: UUID, status: ReviewStatus) -> Review | None:
        review = await self.get_by_id(review_id, load_iterations=False)
        if review:
            review.status = status
            await self.session.commit()
            await self.session.refresh(review)
        return review
