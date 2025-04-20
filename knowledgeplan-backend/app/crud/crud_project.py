from typing import Any, Dict, Optional, List, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.crud.base import CRUDBase
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class CRUDProject(CRUDBase[Project, ProjectCreate, ProjectUpdate]):
    async def create_with_tenant(
        self, db: AsyncSession, *, obj_in: ProjectCreate, tenant_id: UUID
    ) -> Project:
        db_obj = Project(**obj_in.dict(), tenant_id=tenant_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_tenant(
        self, db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Project]:
        result = await db.execute(
            select(self.model)
            .where(Project.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    # Add other project-specific CRUD methods if needed
    # For example, getting projects by team, by goal, etc.

project = CRUDProject(Project) 