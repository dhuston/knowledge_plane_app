from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.db.session import get_db_session
from app.core.security import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    goal_in: schemas.GoalCreate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Create new goal for the current user's tenant.
    """
    # TODO: Add authorization check: Does the user have permission to create goals?
    # TODO: Validate parent_id belongs to the same tenant if provided
    goal = await crud.goal.create_with_tenant(
        db=db, obj_in=goal_in, tenant_id=current_user.tenant_id
    )
    return goal


@router.get("/", response_model=List[schemas.GoalRead])
async def read_goals(
    db: AsyncSession = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve goals for the current user's tenant.
    """
    # TODO: Add filtering by type, parent, status etc.
    goals = await crud.goal.get_multi_by_tenant(
        db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return goals


@router.get("/{goal_id}", response_model=schemas.GoalRead)
async def read_goal(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    goal_id: UUID,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get goal by ID.
    """
    goal = await crud.goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    # Tenant Check
    if goal.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    # TODO: Add more granular visibility checks?
    return goal


@router.put("/{goal_id}", response_model=schemas.GoalRead)
async def update_goal(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    goal_id: UUID,
    goal_in: schemas.GoalUpdate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Update a goal.
    """
    goal = await crud.goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    # Tenant Check
    if goal.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    # TODO: Add authorization check: Does the user have permission to update this goal?
    # TODO: Validate parent_id belongs to the same tenant if changed

    goal_in_dict = goal_in.dict(exclude_unset=True)
    goal = await crud.goal.update(db=db, db_obj=goal, obj_in=goal_in_dict)
    return goal

# Add DELETE endpoint later if needed 