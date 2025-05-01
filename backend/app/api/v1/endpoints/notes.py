from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_project import project as crud_project
from app.crud.crud_knowledge_asset import knowledge_asset as crud_knowledge_asset
from app.crud.crud_activity_log import activity_log as crud_activity_log
from app import models, schemas
from app.core import security
from app.db.session import get_db_session

router = APIRouter()

@router.post("/", response_model=schemas.KnowledgeAssetRead)
async def create_note(
    *, 
    db: AsyncSession = Depends(get_db_session),
    note_in: schemas.KnowledgeAssetCreate,
    current_user: models.User = Depends(security.get_current_user),
) -> models.KnowledgeAsset:
    """Create a new knowledge asset (e.g., a note) associated with a project."""
    # Optional: Check if user has access to the project_id specified
    project = await crud_project.get(db=db, id=note_in.project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or user does not have access")

    knowledge_asset = await crud_knowledge_asset.create(db=db, obj_in=note_in)
    
    # Log activity
    try:
        log_entry = schemas.ActivityLogCreate(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            action="CREATE_KNOWLEDGE_ASSET",
            target_entity_type="KnowledgeAsset",
            target_entity_id=str(knowledge_asset.id),
            details={"project_id": str(knowledge_asset.project_id), "asset_title": knowledge_asset.title}
        )
        await crud_activity_log.create(db=db, obj_in=log_entry)
    except Exception as log_err:
        print(f"Error logging activity for CREATE_KNOWLEDGE_ASSET: {log_err}") # Log error but don't fail request

    return knowledge_asset

# Re-added and updated endpoint
@router.get("/project/{project_id}/recent", response_model=List[schemas.KnowledgeAssetRead]) 
async def read_recent_notes_for_project(
    project_id: UUID,
    limit: int = Query(5, ge=1, le=20, description="Number of recent notes to return"),
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> List[models.KnowledgeAsset]: # Return list of KnowledgeAsset
    """Retrieve the most recent knowledge assets (notes) for a specific project."""
    # Check if user has access to the project
    project = await crud_project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or user does not have access")

    # Use the KnowledgeAsset CRUD function
    recent_assets = await crud_knowledge_asset.get_multi_by_project(
        db=db, project_id=project_id, tenant_id=current_user.tenant_id, limit=limit
    )
    
    # Pydantic will validate the list against KnowledgeAssetRead
    return recent_assets

# Add other endpoints later (get single note, update, delete) if needed 