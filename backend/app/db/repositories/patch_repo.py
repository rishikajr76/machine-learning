from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import Sequence
from app.models.patch import Patch
from app.schemas.patch import PatchCreate

class PatchRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_review(self, review_id: UUID) -> Sequence[Patch]:
        stmt = select(Patch).where(Patch.review_id == review_id).order_by(Patch.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(self, patch_in: PatchCreate) -> Patch:
        db_patch = Patch(
            review_id=patch_in.review_id,
            file_path=patch_in.file_path,
            language=patch_in.language,
            original_code=patch_in.original_code,
            patched_code=patch_in.patched_code,
            diff=patch_in.diff,
            confidence_score=patch_in.confidence_score
        )
        self.session.add(db_patch)
        await self.session.commit()
        await self.session.refresh(db_patch)
        return db_patch
