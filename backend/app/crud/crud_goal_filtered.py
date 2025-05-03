from typing import Any, Dict, Optional, List, Union, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, and_, or_, between
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import true, false

from app.models.goal import Goal as GoalModel
from app.schemas.goal import GoalCreate, GoalUpdate

async def get_multi_by_tenant_filtered(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    filters: Dict[str, Any] = None,
    skip: int = 0,
    limit: int = 100
) -> List[GoalModel]:
    """
    Get multiple goals with filtering options.
    
    Args:
        db: Database session
        tenant_id: Tenant ID to filter by
        filters: Dictionary of filter conditions:
            - type: Goal type (e.g., 'strategic', 'operational')
            - parent_id: Filter by parent goal ID
            - status: Goal status
            - progress_range: Tuple of (min, max) progress values
            - due_date_range: Tuple of (after, before) dates as strings
        skip: Number of records to skip (pagination offset)
        limit: Maximum number of records to return
        
    Returns:
        List of goal models matching the criteria
    """
    # Start with base tenant filter
    query = select(GoalModel).where(GoalModel.tenant_id == tenant_id)
    
    # Apply filters if provided
    if filters:
        # Type filter
        if "type" in filters and filters["type"]:
            query = query.where(GoalModel.type == filters["type"])
            
        # Parent ID filter
        if "parent_id" in filters and filters["parent_id"]:
            query = query.where(GoalModel.parent_id == filters["parent_id"])
            
        # Status filter
        if "status" in filters and filters["status"]:
            query = query.where(GoalModel.status == filters["status"])
            
        # Progress range filter
        if "progress_range" in filters and filters["progress_range"]:
            min_progress, max_progress = filters["progress_range"]
            if min_progress is not None:
                query = query.where(GoalModel.progress >= min_progress)
            if max_progress is not None:
                query = query.where(GoalModel.progress <= max_progress)
                
        # Due date range filter
        if "due_date_range" in filters and filters["due_date_range"]:
            after_date, before_date = filters["due_date_range"]
            
            if after_date:
                # Convert string to datetime if needed
                if isinstance(after_date, str):
                    try:
                        after_date = datetime.fromisoformat(after_date)
                    except ValueError:
                        # Skip invalid date
                        pass
                
                if isinstance(after_date, datetime):
                    query = query.where(GoalModel.due_date >= after_date)
            
            if before_date:
                # Convert string to datetime if needed
                if isinstance(before_date, str):
                    try:
                        before_date = datetime.fromisoformat(before_date)
                    except ValueError:
                        # Skip invalid date
                        pass
                
                if isinstance(before_date, datetime):
                    query = query.where(GoalModel.due_date <= before_date)
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    
    # Execute query
    result = await db.execute(query)
    return list(result.scalars().all())