from typing import Any, Dict, Optional, List, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.crud.base import CRUDBase
from app.models.knowledge_asset import KnowledgeAsset
from app.schemas.knowledge_asset import KnowledgeAssetCreate, KnowledgeAssetUpdate


class CRUDKnowledgeAsset(CRUDBase[KnowledgeAsset, KnowledgeAssetCreate, KnowledgeAssetUpdate]):
    async def create_with_tenant_and_creator(
        self, db: AsyncSession, *, obj_in: KnowledgeAssetCreate, tenant_id: UUID, creator_id: UUID
    ) -> KnowledgeAsset:
        """Creates a knowledge asset, ensuring tenant_id and creator_id are set."""
        # Note: project_id is expected to be in obj_in for notes
        db_obj = KnowledgeAsset(
            **obj_in.dict(),
            tenant_id=tenant_id,
            created_by_user_id=creator_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_project(
        self, db: AsyncSession, *, tenant_id: UUID, project_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[KnowledgeAsset]:
        """Retrieves knowledge assets (e.g., notes) associated with a specific project."""
        result = await db.execute(
            select(self.model)
            .where(KnowledgeAsset.tenant_id == tenant_id, KnowledgeAsset.project_id == project_id)
            .order_by(KnowledgeAsset.created_at.desc()) # Show newest first
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    # Add other KA-specific CRUD methods if needed

knowledge_asset = CRUDKnowledgeAsset(KnowledgeAsset) 