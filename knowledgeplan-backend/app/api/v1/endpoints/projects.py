from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.crud.crud_project import project as crud_project
from app import models, schemas
from app.db.session import get_db_session
from app.core.security import get_current_user
from app.core.permissions import (
    user_can_view_project,
    user_can_edit_project,
    user_can_create_project,
)

router = APIRouter()


@router.post("/", response_model=schemas.ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    project_in: schemas.ProjectCreate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """Create new project for the current user's tenant, if permitted."""
    if not user_can_create_project(current_user):
        raise HTTPException(status_code=403, detail="User does not have permission to create projects")

    project = await crud_project.create_with_tenant(
        db=db, obj_in=project_in, tenant_id=current_user.tenant_id, creator=current_user
    )
    return project


@router.get("/", response_model=List[schemas.ProjectRead])
async def read_projects(
    db: AsyncSession = Depends(get_db_session),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve projects for the current user's tenant.
    """
    # TODO Slice-3: add participation/visibility filtering for scalability.
    projects = await crud_project.get_multi_by_tenant(
        db, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return projects


@router.get("/{project_id}", response_model=schemas.ProjectRead)
async def read_project(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get project by ID.
    """
    project = await crud_project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not user_can_view_project(current_user, project):
        raise HTTPException(status_code=403, detail="User does not have permission to view this project")
    return project


@router.put("/{project_id}", response_model=schemas.ProjectRead)
async def update_project(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    project_in: schemas.ProjectUpdate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Update a project.
    """
    project = await crud_project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not user_can_edit_project(current_user, project):
        raise HTTPException(status_code=403, detail="User does not have permission to update this project")

    project_in_dict = project_in.model_dump(exclude_unset=True)
    project = await crud_project.update(db=db, db_obj=project, obj_in=project_in_dict)
    
    # Log activity
    try:
        log_entry = schemas.ActivityLogCreate(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            action="UPDATE_PROJECT",
            target_entity_type="Project",
            target_entity_id=str(project.id),
            details={"updated_fields": list(project_in_dict.keys())}
        )
        from app.crud.crud_activity_log import activity_log as crud_activity_log
        await crud_activity_log.create(db=db, obj_in=log_entry)
    except Exception as log_err:
        print(f"Error logging activity for UPDATE_PROJECT: {log_err}")

    return project

# Add DELETE endpoint later if needed 


# --- Participants Endpoint --- 

@router.get("/{project_id}/participants", response_model=List[schemas.UserReadBasic])
async def read_project_participants(
    *, 
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """Retrieve participants for a specific project."""
    # Get project first to ensure tenant access
    project = await crud_project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Authorization: only users that can view project can list participants
    if not user_can_view_project(current_user, project):
        raise HTTPException(status_code=403, detail="User does not have permission to view participants of this project")
    
    # Fetch participants using the new CRUD method
    participants = await crud_project.get_participants(db=db, project_id=project_id, tenant_id=current_user.tenant_id)
    return participants # Pydantic will convert User models to UserReadBasic


# --- Notes (Knowledge Asset) Endpoints within Project --- 

@router.post("/{project_id}/notes", response_model=schemas.NoteRead, status_code=status.HTTP_201_CREATED)
async def create_note_for_project(
    *, 
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    # Expect NoteCreate schema (or just content?)
    # Let's refine this - should it be KnowledgeAssetCreate or a specific NoteCreate?
    # For now, sticking with KnowledgeAssetCreate as it aligns with crud method used.
    # However, the response model IS NoteRead, which implies we create a Note.
    note_in: schemas.NoteCreate, # CHANGE: Use NoteCreate for input
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Create a new note (KnowledgeAsset) associated with a project.
    """
    # Verify project exists and belongs to the user's tenant
    project = await crud_project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not user_can_edit_project(current_user, project):
        raise HTTPException(status_code=403, detail="User does not have permission to add notes to this project")
    
    # Use the specific create_note crud function
    from app.crud.crud_knowledge_asset import knowledge_asset as crud_knowledge_asset
    note = await crud_knowledge_asset.create_note(
        db=db, note_in=note_in, owner=current_user, project_id=project_id
    )
    # Need to reload the created_by relationship for the response model
    await db.refresh(note, attribute_names=['created_by'])
    return note

@router.get("/{project_id}/notes", response_model=List[schemas.NoteRead]) # CHANGE: Use NoteRead response model
async def read_notes_for_project(
    *, 
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve notes associated with a specific project.
    """
    # Verify project exists and belongs to the user's tenant
    project = await crud_project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not user_can_view_project(current_user, project):
        raise HTTPException(status_code=403, detail="User does not have permission to view notes for this project")
    
    # Use the specific get_notes_by_project crud function
    from app.crud.crud_knowledge_asset import knowledge_asset as crud_knowledge_asset
    notes = await crud_knowledge_asset.get_notes_by_project(
        db=db, tenant_id=current_user.tenant_id, project_id=project_id, skip=skip, limit=limit
    )
    return notes

# Add endpoints for updating/deleting notes later if needed 