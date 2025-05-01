"""API endpoints for integration management."""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Security, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db_session, get_tenant_id, get_current_active_user
from app.integrations.exceptions import IntegrationError, IntegrationNotFoundError
from app.integrations.manager import IntegrationManager
from app.integrations.registry import connector_registry
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
    """Get an instance of IntegrationManager for dependency injection."""
    return IntegrationManager(db=db, tenant_id=tenant_id)


@router.get("/", response_model=List[Integration])
async def list_integrations(
    integration_type: Optional[str] = None,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    _: User = Depends(get_current_active_user)
):
    """
    List all integrations for the tenant.
    
    Optionally filter by integration_type.
    """
    try:
        return await integration_manager.list_integrations(integration_type)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list integrations: {str(e)}")


@router.post("/", response_model=Integration)
async def create_integration(
    integration: IntegrationCreate,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(get_current_active_user)
):
    """
    Create a new integration.
    """
    try:
        integration_id = await integration_manager.register_integration(integration.dict())
        
        # Fetch the created integration to return it
        stmt = f"SELECT * FROM integrations WHERE id = '{integration_id}'"
        result = await db.execute(stmt)
        created_integration = result.mappings().first()
        
        return Integration.from_orm(created_integration)
    except IntegrationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create integration: {str(e)}")


@router.get("/{integration_id}", response_model=Integration)
async def get_integration(
    integration_id: UUID,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    _: User = Depends(get_current_active_user)
):
    """
    Get details of a specific integration.
    """
    try:
        return await integration_manager.get_integration(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get integration: {str(e)}")


@router.put("/{integration_id}", response_model=Integration)
async def update_integration(
    integration_id: UUID,
    integration_update: IntegrationUpdate,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    _: User = Depends(get_current_active_user)
):
    """
    Update an existing integration.
    """
    try:
        await integration_manager.update_integration(integration_id, integration_update.dict(exclude_unset=True))
        return await integration_manager.get_integration(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except IntegrationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update integration: {str(e)}")


@router.delete("/{integration_id}", response_model=bool)
async def delete_integration(
    integration_id: UUID,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    _: User = Depends(get_current_active_user)
):
    """
    Delete an integration.
    """
    try:
        return await integration_manager.delete_integration(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete integration: {str(e)}")


@router.get("/{integration_id}/status", response_model=IntegrationStatus)
async def get_integration_status(
    integration_id: UUID,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    _: User = Depends(get_current_active_user)
):
    """
    Get current status of an integration.
    """
    try:
        return await integration_manager.get_integration_status(integration_id)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get integration status: {str(e)}")


@router.post("/{integration_id}/run", response_model=IntegrationRunResult)
async def run_integration(
    integration_id: UUID,
    run_request: IntegrationRunRequest,
    background_tasks: BackgroundTasks,
    integration_manager: IntegrationManager = Depends(get_integration_manager),
    _: User = Depends(get_current_active_user)
):
    """
    Run an integration manually.
    
    This endpoint will start the integration run in a background task
    and return immediately with the run ID.
    """
    try:
        # Run in the background to avoid blocking the API
        async def run_integration_task():
            await integration_manager.run_integration(
                integration_id=integration_id,
                entity_types=run_request.entity_types,
                incremental=run_request.incremental
            )
        
        background_tasks.add_task(run_integration_task)
        
        # Return a simple success response
        return {
            "status": "running",
            "message": "Integration run started in background"
        }
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except IntegrationError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to run integration: {str(e)}")


@router.get("/{integration_id}/runs", response_model=List[IntegrationRun])
async def list_integration_runs(
    integration_id: UUID,
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(get_current_active_user)
):
    """
    List integration run history.
    """
    try:
        # Verify integration exists and belongs to the tenant
        integration_manager = IntegrationManager(db=db)
        await integration_manager.get_integration(integration_id)
        
        # Fetch run records
        stmt = f"""
            SELECT * FROM integration_runs
            WHERE integration_id = '{integration_id}'
            ORDER BY start_time DESC
            LIMIT {limit} OFFSET {offset}
        """
        result = await db.execute(stmt)
        runs = result.mappings().all()
        
        return [IntegrationRun.from_orm(run) for run in runs]
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list integration runs: {str(e)}")


@router.get("/{integration_id}/runs/{run_id}", response_model=IntegrationRun)
async def get_integration_run(
    integration_id: UUID,
    run_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    _: User = Depends(get_current_active_user)
):
    """
    Get details of a specific integration run.
    """
    try:
        # Verify integration exists and belongs to the tenant
        integration_manager = IntegrationManager(db=db)
        await integration_manager.get_integration(integration_id)
        
        # Fetch run record
        stmt = f"""
            SELECT * FROM integration_runs
            WHERE id = '{run_id}' AND integration_id = '{integration_id}'
        """
        result = await db.execute(stmt)
        run = result.mappings().first()
        
        if not run:
            raise HTTPException(status_code=404, detail="Integration run not found")
        
        return IntegrationRun.from_orm(run)
    except IntegrationNotFoundError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get integration run: {str(e)}")


@router.get("/types", response_model=List[str])
async def list_integration_types(
    _: User = Depends(get_current_active_user)
):
    """
    List available integration types.
    """
    try:
        return list(connector_registry.available_connectors().keys())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list integration types: {str(e)}")


@router.get("/types/{integration_type}/config-schema", response_model=dict)
async def get_integration_config_schema(
    integration_type: str,
    _: User = Depends(get_current_active_user)
):
    """
    Get configuration schema for an integration type.
    
    This returns a JSON Schema that describes the expected configuration
    for the specified integration type.
    """
    try:
        try:
            connector_class = connector_registry.get_connector_class(integration_type)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Integration type '{integration_type}' not found")
        
        # Get config schema from the connector class
        schema = getattr(connector_class, "CONFIG_SCHEMA", {})
        if not schema:
            return {
                "type": "object",
                "properties": {},
                "additionalProperties": True
            }
        
        return schema
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get integration config schema: {str(e)}")