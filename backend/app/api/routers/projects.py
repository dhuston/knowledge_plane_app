from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID

from app.db.session import get_db_session
from app.core.security import get_current_user
from app.models.user import User as UserModel
from app.models.project import Project as ProjectModel
from app.models.knowledge_asset import KnowledgeAsset as NoteModel
from app.schemas.project import ProjectRead, ProjectCreate, ProjectUpdate
from app.schemas.knowledge_asset import NoteRead, NoteCreate
from app.schemas.user import UserReadBasic
from app.crud.crud_project import project as crud_project_instance
from app.crud import crud_knowledge_asset

router = APIRouter()

@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_new_project(
    *, 
    db: AsyncSession = Depends(get_db_session),
    project_in: ProjectCreate,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Create a new project. Ownership defaults to the creator's team.
    """
    project_result = await crud_project_instance.create_with_tenant(
        db=db, obj_in=project_in, tenant_id=current_user.tenant_id, creator=current_user
    )
    return project_result

@router.get("/{project_id}", response_model=ProjectRead)
async def read_project_by_id(
    *, 
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    current_user: UserModel = Depends(get_current_user) # Ensures user is logged in
):
    """
    Get a specific project by ID.
    Ensures the project belongs to the user's tenant.
    """
    project = await crud_project_instance.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Project not found or not part of your tenant."
        )
    # TODO: Add more granular access control later (e.g., is user a member?)
    return project

@router.post("/{project_id}/notes", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
async def create_project_note(
    *,
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    note_in: NoteCreate,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Create a new note associated with a specific project.
    """
    # First, verify the project exists and belongs to the user's tenant
    project = await crud_project_instance.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or not part of your tenant."
        )
    
    # Create the note, linking it to the project and current user
    note = await crud_knowledge_asset.create_note(
        db=db, note_in=note_in, owner=current_user, project_id=project_id
    )
    return note

@router.get("/{project_id}/notes", response_model=List[NoteRead])
async def read_project_notes(
    *,
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Retrieve notes associated with a specific project.
    """
    # Verify the project exists and belongs to the user's tenant
    project = await crud_project_instance.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or not part of your tenant."
        )
    
    # Fetch the notes for this project
    notes = await crud_knowledge_asset.get_notes_by_project(
        db=db, project_id=project_id, tenant_id=current_user.tenant_id, skip=skip, limit=limit
    )
    return notes

# Add endpoint for project participants
@router.get("/{project_id}/participants", response_model=List[UserReadBasic]) # Assuming UserReadBasic is the correct schema
async def read_project_participants(
    *,
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    current_user: UserModel = Depends(get_current_user)
):
    """
    Retrieve participants (users) associated with a specific project.
    """
    # Verify the project exists and belongs to the user's tenant
    project = await crud_project_instance.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or not part of your tenant."
        )

    # Fetch project participants using the crud method
    participants = await crud_project_instance.get_participants(
        db=db, project_id=project_id, tenant_id=current_user.tenant_id
    )
    return participants

# Optional: Add listing endpoint later
# @router.get("/", response_model=List[ProjectRead])
# async def read_projects(...):
#     """Retrieve projects relevant to the current user."""
#     # Logic to fetch projects owned by user, by team, etc.
#     pass

# Optional: Add update endpoint later
# @router.put("/{project_id}", response_model=ProjectRead)
# async def update_existing_project(...):
#     """Update a project."""
#     # Check permissions first
#     pass

# --- Add the PUT endpoint --- 
@router.put("/{project_id}", response_model=ProjectRead)
async def update_existing_project(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    project_in: ProjectUpdate,
    current_user: UserModel = Depends(get_current_user),
):
    """Update a project."""
    # Fetch the existing project
    project = await crud_project_instance.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Project not found or not part of your tenant."
        )

    # TODO: Add permissions check (e.g., user_can_edit_project)
    # from app.core.permissions import user_can_edit_project
    # if not user_can_edit_project(current_user, project):
    #     raise HTTPException(status_code=403, detail="User does not have permission to update this project")

    # Update the project
    project_in_dict = project_in.model_dump(exclude_unset=True)
    updated_project = await crud_project_instance.update(db=db, db_obj=project, obj_in=project_in_dict)
    
    # Log activity (consider moving logging into CRUD or a decorator)
    try:
        log_entry = schemas.ActivityLogCreate(
            tenant_id=current_user.tenant_id,
            user_id=current_user.id,
            action="UPDATE_PROJECT",
            target_entity_type="Project",
            target_entity_id=str(updated_project.id),
            details={"updated_fields": list(project_in_dict.keys())}
        )
        from app.crud.crud_activity_log import activity_log as crud_activity_log
        await crud_activity_log.create(db=db, obj_in=log_entry)
    except Exception as log_err:
        print(f"Error logging activity for UPDATE_PROJECT: {log_err}")

    return updated_project

# Optional: Add delete endpoint later
# @router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_existing_project(...):
#     """Delete a project."""
#     # Check permissions first
#     pass 