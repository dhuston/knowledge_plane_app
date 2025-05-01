from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import Sequence
import uuid

from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogCreate

class CRUDActivityLog:
    async def create(self, db: AsyncSession, *, obj_in: ActivityLogCreate) -> ActivityLog:
        """Create a new activity log entry."""
        db_obj = ActivityLog(
            tenant_id=obj_in.tenant_id,
            user_id=obj_in.user_id,
            action=obj_in.action,
            target_entity_type=obj_in.target_entity_type,
            target_entity_id=obj_in.target_entity_id,
            details=obj_in.details,
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_user(
        self, db: AsyncSession, *, user_id: uuid.UUID, tenant_id: uuid.UUID, skip: int = 0, limit: int = 100
    ) -> Sequence[ActivityLog]:
        """Retrieve recent activity logs for a specific user within a tenant."""
        result = await db.execute(
            select(ActivityLog)
            .where(ActivityLog.user_id == user_id, ActivityLog.tenant_id == tenant_id)
            .order_by(desc(ActivityLog.timestamp))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    # Add other methods as needed, e.g., get_multi_by_tenant, get_multi_by_target

activity_log = CRUDActivityLog() 