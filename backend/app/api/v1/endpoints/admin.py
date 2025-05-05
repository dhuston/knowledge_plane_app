"""API endpoints for admin functionality."""

from typing import List, Optional, Dict, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_current_active_user, get_tenant_id, get_current_active_superuser
from app.models.user import User
from app.schemas.user import UserRead
from app.core.tenant_filter import apply_tenant_filter

# Import the CRUDUser for user operations
from app.crud.crud_user import user as crud_user

# Create Feature Flag models and schemas
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from datetime import datetime

class FeatureFlag(BaseModel):
    """Feature flag schema."""
    key: str
    enabled: bool = True
    description: str = ""
    category: str = "General"

class FeatureFlagCreate(BaseModel):
    """Schema for creating a feature flag."""
    key: str
    enabled: bool = True
    description: str = ""
    category: str = "General"

class FeatureFlagUpdate(BaseModel):
    """Schema for updating a feature flag."""
    enabled: Optional[bool] = None
    description: Optional[str] = None
    category: Optional[str] = None

router = APIRouter()

# ----- User Management Endpoints -----

@router.get("/users", response_model=List[UserRead], dependencies=[Depends(get_current_active_superuser)])
async def get_all_users(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: UUID = Depends(get_tenant_id),
    skip: int = 0,
    limit: int = 100,
):
    """
    Get all users in the current tenant.
    
    Only accessible to superusers.
    """
    # Create a query to select all users in the tenant
    query = select(User).filter(User.tenant_id == tenant_id)
    
    # Add pagination
    query = query.offset(skip).limit(limit)
    
    # Execute the query
    result = await db.execute(query)
    users = result.scalars().all()
    
    return users

@router.get("/users/count", dependencies=[Depends(get_current_active_superuser)])
async def get_user_count(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: UUID = Depends(get_tenant_id),
):
    """
    Get total number of users in current tenant.
    
    Only accessible to superusers.
    """
    # Create a query to count users in the tenant
    query = select(func.count()).select_from(User).filter(User.tenant_id == tenant_id)
    
    # Execute the query
    result = await db.execute(query)
    count = result.scalar_one()
    
    return {"count": count}

@router.put("/users/{user_id}/role", dependencies=[Depends(get_current_active_superuser)])
async def update_user_role(
    user_id: UUID,
    is_superuser: bool,
    db: AsyncSession = Depends(get_db_session),
    tenant_id: UUID = Depends(get_tenant_id),
):
    """
    Update a user's superuser status.
    
    Only accessible to superusers.
    """
    # Get the user to update
    user = await crud_user.get(db, user_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ensure the user is in the same tenant
    if user.tenant_id != tenant_id:
        raise HTTPException(status_code=403, detail="Cannot modify users from other tenants")
    
    # Update the user's superuser status
    user.is_superuser = is_superuser
    db.add(user)
    await db.commit()
    
    return {"success": True}

# ----- Feature Flag Management Endpoints -----

# In-memory store for feature flags keyed by tenant ID
# In a production environment, this should be stored in a database
_feature_flags: Dict[UUID, Dict[str, FeatureFlag]] = {}

# Default feature flags
DEFAULT_FEATURE_FLAGS = {
    "enableDeltaStream": FeatureFlag(key="enableDeltaStream", enabled=True, description="Enable real-time data streaming", category="Real-time Features"),
    "enableIntegrations": FeatureFlag(key="enableIntegrations", enabled=True, description="Enable external integrations", category="UI Components"),
    "enableAnalytics": FeatureFlag(key="enableAnalytics", enabled=True, description="Enable analytics features", category="Visualization Features"),
    "enableSuggestions": FeatureFlag(key="enableSuggestions", enabled=True, description="Enable AI-powered suggestions", category="UI Components"),
    "enableActivityTimeline": FeatureFlag(key="enableActivityTimeline", enabled=True, description="Enable activity timeline", category="UI Components"),
    "enableTeamClustering": FeatureFlag(key="enableTeamClustering", enabled=True, description="Enable team clustering on the map", category="Visualization Features"),
    "enableHierarchyNavigator": FeatureFlag(key="enableHierarchyNavigator", enabled=True, description="Enable organizational hierarchy navigator", category="Navigation"),
}

def get_tenant_feature_flags(tenant_id: UUID) -> Dict[str, FeatureFlag]:
    """
    Get feature flags for a tenant.
    
    If the tenant doesn't have feature flags yet, initialize with defaults.
    """
    if tenant_id not in _feature_flags:
        _feature_flags[tenant_id] = DEFAULT_FEATURE_FLAGS.copy()
    return _feature_flags[tenant_id]

@router.get("/feature-flags", response_model=Dict[str, FeatureFlag])
async def get_feature_flags(
    tenant_id: UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_active_user),
):
    """Get all feature flags for the current tenant."""
    # Additional debug logging for CORS troubleshooting
    print(f"[DEBUG] Admin feature-flags endpoint accessed by user {current_user.id}, tenant {tenant_id}, admin={getattr(current_user, 'is_admin', False)}")
    return get_tenant_feature_flags(tenant_id)

@router.post("/feature-flags", response_model=FeatureFlag, dependencies=[Depends(get_current_active_superuser)])
async def create_feature_flag(
    feature_flag: FeatureFlagCreate,
    tenant_id: UUID = Depends(get_tenant_id),
):
    """
    Create a new feature flag.
    
    Only accessible to superusers.
    """
    tenant_flags = get_tenant_feature_flags(tenant_id)
    
    if feature_flag.key in tenant_flags:
        raise HTTPException(status_code=400, detail=f"Feature flag with key '{feature_flag.key}' already exists")
    
    new_flag = FeatureFlag(**feature_flag.model_dump())
    tenant_flags[feature_flag.key] = new_flag
    
    return new_flag

@router.put("/feature-flags/{key}", response_model=FeatureFlag, dependencies=[Depends(get_current_active_superuser)])
async def update_feature_flag(
    key: str,
    feature_flag: FeatureFlagUpdate,
    tenant_id: UUID = Depends(get_tenant_id),
):
    """
    Update a feature flag.
    
    Only accessible to superusers.
    """
    tenant_flags = get_tenant_feature_flags(tenant_id)
    
    if key not in tenant_flags:
        raise HTTPException(status_code=404, detail=f"Feature flag with key '{key}' not found")
    
    update_data = feature_flag.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(tenant_flags[key], field, value)
    
    return tenant_flags[key]

@router.delete("/feature-flags/{key}", dependencies=[Depends(get_current_active_superuser)])
async def delete_feature_flag(
    key: str,
    tenant_id: UUID = Depends(get_tenant_id),
):
    """
    Delete a feature flag.
    
    Only accessible to superusers.
    """
    tenant_flags = get_tenant_feature_flags(tenant_id)
    
    if key not in tenant_flags:
        raise HTTPException(status_code=404, detail=f"Feature flag with key '{key}' not found")
    
    del tenant_flags[key]
    
    return {"success": True}

# ----- Admin Dashboard Stats Endpoints -----

@router.get("/stats/summary")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: UUID = Depends(get_tenant_id),
    current_user: User = Depends(get_current_active_superuser),  # Only superusers
):
    """
    Get summary statistics for the admin dashboard.
    
    Only accessible to superusers.
    """
    # Count users
    user_query = select(func.count()).select_from(User).filter(User.tenant_id == tenant_id)
    user_count_result = await db.execute(user_query)
    user_count = user_count_result.scalar_one()
    
    # Count teams
    from app.models.team import Team
    team_query = select(func.count()).select_from(Team).filter(Team.tenant_id == tenant_id)
    team_count_result = await db.execute(team_query)
    team_count = team_count_result.scalar_one()
    
    # Count projects
    from app.models.project import Project
    project_query = select(func.count()).select_from(Project).filter(Project.tenant_id == tenant_id)
    project_count_result = await db.execute(project_query)
    project_count = project_count_result.scalar_one()
    
    # Count integrations
    stmt = "SELECT COUNT(*) FROM integrations WHERE tenant_id = :tenant_id"
    integration_count_result = await db.execute(stmt, {"tenant_id": tenant_id})
    integration_count = integration_count_result.scalar_one()
    
    return {
        "users": user_count,
        "teams": team_count,
        "projects": project_count,
        "integrations": integration_count,
    }