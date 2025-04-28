from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.crud_goal import goal as crud_goal
from app.crud.crud_user import user as crud_user
from app.crud.crud_activity_log import activity_log as crud_activity_log
from app import models, schemas
from app.db.session import get_db_session
from app.core.security import get_current_user
from app.core.permissions import user_can_view_goal, user_can_edit_goal, user_can_create_goal

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
    # Add authorization check
    if not user_can_create_goal(current_user):
        raise HTTPException(status_code=403, detail="User does not have permission to create goals")
    
    # Validate parent_id belongs to the same tenant if provided
    if goal_in.parent_id:
        parent_goal = await crud_goal.get(db=db, id=goal_in.parent_id)
        if not parent_goal or parent_goal.tenant_id != current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Parent goal with ID {goal_in.parent_id} not found or not in the same tenant."
            )
            
    goal = await crud_goal.create_with_tenant(
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
    goals = await crud_goal.get_multi_by_tenant(
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
    goal = await crud_goal.get(db=db, id=goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    if not user_can_view_goal(current_user, goal):
        raise HTTPException(status_code=403, detail="User does not have permission to view this goal")
    return goal


@router.put("/{goal_id}", response_model=schemas.GoalRead)
async def update_goal(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    goal_id: UUID,
    goal_in: schemas.GoalUpdate,
    current_user_dep: models.User = Depends(get_current_user),
) -> Any:
    """
    Update a goal.
    """
    # Fetch goal with projects relationship loaded
    goal = await crud_goal.get(db=db, id=goal_id, options=[selectinload(models.Goal.projects)])
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
        
    # Reinstating user fetch as permission check might need it, but remove eager load option
    current_user = await crud_user.get(db=db, id=current_user_dep.id) 
    if not current_user:
         raise HTTPException(status_code=401, detail="Could not re-verify current user")

    # Now perform the authorization check with loaded relationships
    if not user_can_edit_goal(user_id=current_user.id, user_team_id=current_user.team_id, goal=goal):
        raise HTTPException(status_code=403, detail="User does not have permission to update this goal")
    
    # Validate parent_id belongs to the same tenant if changed
    if goal_in.parent_id and goal_in.parent_id != goal.parent_id:
        parent_goal = await crud_goal.get(db=db, id=goal_in.parent_id)
        if not parent_goal or parent_goal.tenant_id != current_user.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Parent goal with ID {goal_in.parent_id} not found or not in the same tenant."
            )

    goal_in_dict = goal_in.model_dump(exclude_unset=True)
    goal = await crud_goal.update(db=db, db_obj=goal, obj_in=goal_in_dict)
    
    # Log activity
    try:
        log_entry = schemas.ActivityLogCreate(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            action="UPDATE_GOAL",
            target_entity_type="Goal",
            target_entity_id=str(goal.id),
            details={"updated_fields": list(goal_in_dict.keys())} # Log which fields were updated
        )
        await crud_activity_log.create(db=db, obj_in=log_entry)
    except Exception as log_err:
        print(f"Error logging activity for UPDATE_GOAL: {log_err}")

    return goal

# Add DELETE endpoint later if needed 