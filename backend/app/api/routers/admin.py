"""
Admin Router - aggregates the admin endpoints
"""

from fastapi import APIRouter, Depends
from typing import Dict
from uuid import UUID

from app.api.v1.endpoints.admin import router as admin_endpoint_router
from app.api.v1.endpoints.admin import FeatureFlag, get_tenant_feature_flags
from app.api import deps
from app.models.user import User

router = APIRouter()

# Include the admin endpoint router
router.include_router(admin_endpoint_router)

# Add convenience route at the top level for feature flags
@router.get("/feature-flags", response_model=Dict[str, FeatureFlag])
def get_feature_flags(
    tenant_id: UUID = Depends(deps.get_tenant_id),
    current_user: User = Depends(deps.get_current_active_user),
):
    """Get all feature flags for the current tenant."""
    return get_tenant_feature_flags(tenant_id)