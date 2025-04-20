from typing import Any, Dict, Optional, List, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.crud.base import CRUDBase
from app.models.goal import Goal
from app.schemas.goal import GoalCreate, GoalUpdate


class CRUDGoal(CRUDBase[Goal, GoalCreate, GoalUpdate]):
    async def create_with_tenant(
        self, db: AsyncSession, *, obj_in: GoalCreate, tenant_id: UUID
    ) -> Goal:
        db_obj = Goal(**obj_in.dict(), tenant_id=tenant_id)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_tenant(
        self, db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Goal]:
        result = await db.execute(
            select(self.model)
            .where(Goal.tenant_id == tenant_id)
            # Consider adding default ordering, e.g., by type or title
            .order_by(Goal.title) # Example ordering
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    # Add other goal-specific CRUD methods if needed
    # For example, getting goals by parent, by type, etc.

goal = CRUDGoal(Goal) 