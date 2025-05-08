"""API endpoints for the new streamlined integration system."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_tenant_id, get_current_active_user
from app.integrations.manager import IntegrationManager
from app.integrations.schemas import (
    Integration,
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationStatus,
    IntegrationRun,
    IntegrationRunRequest,
    IntegrationRunResult
)
from app.models.user import User

router = APIRouter()


async def get_integration_manager(
    db: AsyncSession = Depends(get_db_session),
    tenant_id: UUID = Depends(get_tenant_id)
) -> IntegrationManager:
    """Dependency for getting an integration manager instance."""
    return IntegrationManager(db=db, tenant_id=tenant_id)


@router.get("/integrations", response_model=List[Integration])
async def list_integrations(
    integration_type: Optional[str] = None,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:read"])
) -> List[Integration]:
    """
    List all integrations for the current tenant.
    
    Optionally filter by integration type.
    """
    return await manager.list_integrations(integration_type)


@router.post("/integrations", response_model=UUID)
async def create_integration(
    integration: IntegrationCreate,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:write"])
) -> UUID:
    """
    Create a new integration.
    """
    try:
        integration_id = await manager.register_integration(integration.model_dump())
        return integration_id
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create integration: {e}")


@router.get("/integrations/{integration_id}", response_model=Integration)
async def get_integration(
    integration_id: UUID,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:read"])
) -> Integration:
    """
    Get details of a specific integration.
    """
    try:
        return await manager.get_integration(integration_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Integration not found")


@router.put("/integrations/{integration_id}", response_model=bool)
async def update_integration(
    integration_id: UUID,
    integration: IntegrationUpdate,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:write"])
) -> bool:
    """
    Update an existing integration.
    """
    try:
        # Only include non-None fields in the update
        update_data = {k: v for k, v in integration.model_dump().items() if v is not None}
        return await manager.update_integration(integration_id, update_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update integration: {e}")


@router.delete("/integrations/{integration_id}", response_model=bool)
async def delete_integration(
    integration_id: UUID,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:write"])
) -> bool:
    """
    Delete an integration.
    """
    try:
        return await manager.delete_integration(integration_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete integration: {e}")


@router.get("/integrations/{integration_id}/status", response_model=IntegrationStatus)
async def get_integration_status(
    integration_id: UUID,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:read"])
) -> IntegrationStatus:
    """
    Get status of an integration including recent runs.
    """
    try:
        return await manager.get_integration_status(integration_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get integration status: {e}")


@router.post("/integrations/{integration_id}/run", response_model=IntegrationRunResult)
async def run_integration(
    integration_id: UUID,
    run_request: IntegrationRunRequest,
    background_tasks: BackgroundTasks,
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:execute"])
) -> IntegrationRunResult:
    """
    Run an integration manually or schedule it to run in the background.
    """
    try:
        # Execute integration in background
        result = await manager.run_integration(
            integration_id, 
            entity_types=run_request.entity_types,
            incremental=run_request.incremental
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run integration: {e}")


@router.get("/integration-types", response_model=List[str])
async def list_integration_types(
    manager: IntegrationManager = Depends(get_integration_manager),
    current_user: User = Security(get_current_active_user, scopes=["integrations:read"])
) -> List[str]:
    """
    List available integration types.
    """
    return list(IntegrationManager.CONNECTOR_REGISTRY.keys())