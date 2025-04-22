from typing import Any, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud, models, schemas
from app.db.session import get_db_session
from app.core.security import get_current_user

router = APIRouter()


@router.post("/", response_model=schemas.ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    *, # Enforces keyword-only arguments after this
    db: AsyncSession = Depends(get_db_session),
    project_in: schemas.ProjectCreate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Create new project for the current user's tenant.
    """
    # TODO: Add authorization check: Does the user have permission to create projects?
    project = await crud.project.create_with_tenant(
        db=db, obj_in=project_in, tenant_id=current_user.tenant_id
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
    # TODO: Add more sophisticated filtering based on user participation/visibility?
    projects = await crud.project.get_multi_by_tenant(
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
    project = await crud.project.get(db=db, id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Tenant Check
    if project.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    # TODO: Add more granular visibility checks (e.g., is user a participant?)
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
    project = await crud.project.get(db=db, id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Tenant Check
    if project.tenant_id != current_user.tenant_id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    # --- Basic Authorization Check --- 
    # TODO: Replace with a more robust RBAC or permission system later.
    # Example: Allow update only if the user is on the owning team.
    can_update = False
    if project.owning_team_id and current_user.team_id == project.owning_team_id:
        can_update = True
    # Add other conditions, e.g., if user is project owner (add owner_id field?)
    # or if user has specific admin role.
    
    if not can_update:
         raise HTTPException(status_code=403, detail="User does not have permission to update this project")
    # --- End Authorization Check --- 

    project_in_dict = project_in.dict(exclude_unset=True)
    project = await crud.project.update(db=db, db_obj=project, obj_in=project_in_dict)
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
    # Get project and verify tenant access first
    # Pass tenant_id from current_user
    project = await crud.project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        # This check implicitly handles tenant access because get requires tenant_id
        raise HTTPException(status_code=404, detail="Project not found")
    # Remove redundant tenant check (already handled by crud.project.get)
    # if project.tenant_id != current_user.tenant_id:
    #     raise HTTPException(status_code=403, detail="Not enough permissions for this project")
    
    # TODO: Add check if current_user should be able to see participants?

    # Fetch participants using the new CRUD method
    participants = await crud.project.get_participants(db=db, project_id=project_id, tenant_id=current_user.tenant_id)
    return participants # Pydantic will convert User models to UserReadBasic


# --- Notes (Knowledge Asset) Endpoints within Project --- 

@router.post("/{project_id}/notes", response_model=schemas.KnowledgeAsset, status_code=status.HTTP_201_CREATED)
async def create_note_for_project(
    *, 
    db: AsyncSession = Depends(get_db_session),
    project_id: UUID,
    note_in: schemas.KnowledgeAssetCreate, # Expects content, project_id will be overridden
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Create a new note (KnowledgeAsset) associated with a project.
    """
    # Verify project exists and belongs to the user's tenant
    # Pass tenant_id to the get call
    project = await crud.project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Remove redundant tenant check (already handled by crud.project.get)
    # if project.tenant_id != current_user.tenant_id:
    #     raise HTTPException(status_code=403, detail="Not enough permissions for this project")
    
    # TODO: Add check if user can add notes to this project (e.g., participant)

    # Ensure the note is created with the correct project_id and type='note'
    # Use model_dump() for Pydantic v2
    note_create_data = note_in.model_dump(exclude_unset=True)
    note_create_data["project_id"] = project_id
    note_create_data["type"] = schemas.KnowledgeAssetTypeEnum.NOTE

    # Re-create the Pydantic model to ensure validation after updates
    validated_note_in = schemas.KnowledgeAssetCreate(**note_create_data)

    note = await crud.knowledge_asset.create_with_tenant_and_creator(
        db=db, obj_in=validated_note_in, tenant_id=current_user.tenant_id, creator_id=current_user.id
    )
    return note

@router.get("/{project_id}/notes", response_model=List[schemas.KnowledgeAsset])
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
    # Pass tenant_id to the get call
    project = await crud.project.get(db=db, id=project_id, tenant_id=current_user.tenant_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Remove redundant tenant check
    # if project.tenant_id != current_user.tenant_id:
    #     raise HTTPException(status_code=403, detail="Not enough permissions for this project")
    
    # TODO: Add check if user can view notes for this project (e.g., participant)

    notes = await crud.knowledge_asset.get_multi_by_project(
        db, tenant_id=current_user.tenant_id, project_id=project_id, skip=skip, limit=limit
    )
    return notes

# Add endpoints for updating/deleting notes later if needed 