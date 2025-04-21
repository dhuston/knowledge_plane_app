from typing import Any, Dict, Optional, List, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update

from app.models.goal import Goal as GoalModel
from app.models.user import User # For potential owner assignment later
from app.schemas.goal import GoalCreate, GoalUpdate


# --- Standalone CRUD Functions --- 

async def get_goal(
    db: AsyncSession, *, goal_id: UUID, tenant_id: UUID
) -> Optional[GoalModel]:
    """Get a single goal by ID, ensuring tenant isolation."""
    result = await db.execute(
        select(GoalModel).where(GoalModel.id == goal_id, GoalModel.tenant_id == tenant_id)
    )
    return result.scalar_one_or_none()

async def get_multi_goal(
    db: AsyncSession, *, skip: int = 0, limit: int = 100
) -> List[GoalModel]:
    """Gets multiple goals with pagination."""
    result = await db.execute(select(GoalModel).offset(skip).limit(limit).order_by(GoalModel.title))
    return result.scalars().all()

async def get_multi_goal_by_tenant(
    db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
) -> List[GoalModel]:
    """Gets multiple goals for a specific tenant with pagination."""
    result = await db.execute(
        select(GoalModel)
        .where(GoalModel.tenant_id == tenant_id)
        .order_by(GoalModel.title) # Keep example ordering
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def create_goal(
    db: AsyncSession, *, goal_in: GoalCreate, tenant_id: UUID # Use tenant_id from user
) -> GoalModel:
    """Create a new goal."""
    # owner_id could be added later based on current_user
    db_goal = GoalModel(
        **goal_in.dict(),
        tenant_id=tenant_id 
    )
    db.add(db_goal)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

async def update_goal(
    db: AsyncSession, *, db_goal: GoalModel, goal_in: GoalUpdate
) -> GoalModel:
    """Update an existing goal."""
    goal_data = goal_in.dict(exclude_unset=True)
    for field, value in goal_data.items():
        setattr(db_goal, field, value)
    await db.commit()
    await db.refresh(db_goal)
    return db_goal

async def delete_goal(db: AsyncSession, *, goal_id: UUID, tenant_id: UUID) -> Optional[GoalModel]:
    """Delete a goal."""
    db_goal = await get_goal(db, goal_id=goal_id, tenant_id=tenant_id)
    if db_goal:
        await db.delete(db_goal)
        await db.commit()
    return db_goal

# --- CRUD Class using Standalone Functions --- 

# Removed inheritance from CRUDBase
class CRUDGoal():
    async def create_with_tenant(
        self, db: AsyncSession, *, obj_in: GoalCreate, tenant_id: UUID
    ) -> GoalModel:
        return await create_goal(db=db, obj_in=obj_in, tenant_id=tenant_id)

    async def get_multi_by_tenant(
        self, db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[GoalModel]:
        return await get_multi_goal_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)

    # Add wrappers for standard CRUD operations
    async def get(self, db: AsyncSession, id: UUID) -> GoalModel | None:
        return await get_goal(db, goal_id=id)
        
    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[GoalModel]:
        return await get_multi_goal(db=db, skip=skip, limit=limit)

    async def create(self, db: AsyncSession, *, obj_in: GoalCreate, tenant_id: UUID) -> GoalModel:
        return await create_goal(db=db, obj_in=obj_in, tenant_id=tenant_id)

    async def update(
        self, db: AsyncSession, *, db_obj: GoalModel, obj_in: Union[GoalUpdate, Dict[str, Any]]
    ) -> GoalModel:
        return await update_goal(db=db, db_obj=db_obj, obj_in=obj_in)

    async def remove(self, db: AsyncSession, *, id: UUID) -> GoalModel | None:
        return await delete_goal(db=db, goal_id=id)

# Removed model from instantiation
goal = CRUDGoal() 