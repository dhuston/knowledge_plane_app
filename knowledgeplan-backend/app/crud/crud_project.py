from typing import Any, Dict, Optional, List, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from sqlalchemy.orm import selectinload

from app.models.project import Project as ProjectModel
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate


# --- Standalone CRUD Functions --- 

async def get_project(
    db: AsyncSession, *, project_id: UUID, tenant_id: UUID
) -> Optional[ProjectModel]:
    """Get a single project by ID, ensuring tenant isolation."""
    result = await db.execute(
        select(ProjectModel).where(ProjectModel.id == project_id, ProjectModel.tenant_id == tenant_id)
    )
    return result.scalar_one_or_none()

async def get_multi_project(
    db: AsyncSession, *, skip: int = 0, limit: int = 100
) -> List[ProjectModel]:
    """Gets multiple projects with pagination."""
    result = await db.execute(select(ProjectModel).offset(skip).limit(limit))
    return result.scalars().all()

async def get_multi_project_by_tenant(
    db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
) -> List[ProjectModel]:
    """Gets multiple projects for a specific tenant with pagination."""
    result = await db.execute(
        select(ProjectModel)
        .where(ProjectModel.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_projects_by_owner(
    db: AsyncSession, *, owner_id: UUID, tenant_id: UUID, skip: int = 0, limit: int = 100
) -> List[ProjectModel]:
    """Get projects owned by a specific user."""
    result = await db.execute(
        select(ProjectModel)
        .where(ProjectModel.owner_id == owner_id, ProjectModel.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def get_projects_by_team(
    db: AsyncSession, *, team_id: UUID, tenant_id: UUID, skip: int = 0, limit: int = 100
) -> List[ProjectModel]:
    """Get projects owned by a specific team."""
    result = await db.execute(
        select(ProjectModel)
        .where(ProjectModel.owning_team_id == team_id, ProjectModel.tenant_id == tenant_id)
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def create_project(
    db: AsyncSession, *, obj_in: ProjectCreate, tenant_id: UUID, creator: User
) -> ProjectModel:
    """Creates a new project associated with a tenant and creator's team."""
    # Convert Pydantic schema to dict
    create_data = obj_in.dict()
    
    # Set/override owning_team_id based on the creator's team
    # Add error handling or default if creator.team_id might be None
    if creator.team_id:
        create_data['owning_team_id'] = creator.team_id
    elif 'owning_team_id' in create_data:
         # If creator has no team, but frontend provided one, keep it?
         # Or raise an error? For now, let's remove it to avoid conflict
         # Or better, let validation handle this upstream? 
         # Current fix: ensure we don't pass it twice.
         pass # Keep the one from create_data if creator has no team
    # Else: owning_team_id will be null if not in create_data and creator has no team
    
    db_project = ProjectModel(
        **create_data, # Pass potentially modified dict
        tenant_id=tenant_id
        # Removed explicit owning_team_id=creator.team_id
    )
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    return db_project

async def update_project(
    db: AsyncSession, *, db_project: ProjectModel, project_in: ProjectUpdate
) -> ProjectModel:
    """Update an existing project."""
    project_data = project_in.dict(exclude_unset=True)
    for field, value in project_data.items():
        setattr(db_project, field, value)
    await db.commit()
    await db.refresh(db_project)
    return db_project

async def delete_project(db: AsyncSession, *, project_id: UUID, tenant_id: UUID) -> Optional[ProjectModel]:
    """Delete a project."""
    db_project = await get_project(db, project_id=project_id, tenant_id=tenant_id)
    if db_project:
        await db.delete(db_project)
        await db.commit()
    return db_project

async def get_participants_for_project(
    db: AsyncSession, *, project_id: UUID, tenant_id: UUID
) -> List[User]:
    """Fetches participants (User models) for a specific project."""
    # Get the project first to access the relationship
    project = await db.get(
        ProjectModel, 
        project_id, 
        options=[selectinload(ProjectModel.participants)]
    )
    
    # Check tenant and existence
    if not project or project.tenant_id != tenant_id:
        return []
        
    return project.participants

# --- CRUD Class using Standalone Functions --- 

# Removed inheritance from CRUDBase
class CRUDProject(): 
    # Method to create with tenant (already specific)
    async def create_with_tenant(
        self, db: AsyncSession, *, obj_in: ProjectCreate, tenant_id: UUID, creator: User
    ) -> ProjectModel:
        # Call the standalone create function
        return await create_project(db=db, obj_in=obj_in, tenant_id=tenant_id, creator=creator)

    # Method to get multiple by tenant (already specific)
    async def get_multi_by_tenant(
        self, db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[ProjectModel]:
        # Call the standalone function
        return await get_multi_project_by_tenant(db=db, tenant_id=tenant_id, skip=skip, limit=limit)

    # Add method to get projects by owning team
    async def get_projects_by_team(
        self, db: AsyncSession, *, team_id: UUID, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[ProjectModel]:
        """Wrapper method to get projects owned by a specific team."""
        # Call the standalone function
        return await get_projects_by_team(
            db=db, team_id=team_id, tenant_id=tenant_id, skip=skip, limit=limit
        )

    # Add wrappers for standard CRUD operations using standalone functions
    async def get(self, db: AsyncSession, *, id: UUID, tenant_id: UUID) -> ProjectModel | None:
        # Pass tenant_id to underlying function
        return await get_project(db=db, project_id=id, tenant_id=tenant_id)
        
    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[ProjectModel]:
        return await get_multi_project(db=db, skip=skip, limit=limit)

    async def create(self, db: AsyncSession, *, obj_in: ProjectCreate, tenant_id: UUID, creator: User) -> ProjectModel:
        # Note: Original CRUDBase likely didn't require tenant_id here
        # This now matches create_with_tenant
        return await create_project(db=db, obj_in=obj_in, tenant_id=tenant_id, creator=creator)

    async def update(
        self, db: AsyncSession, *, db_obj: ProjectModel, obj_in: Union[ProjectUpdate, Dict[str, Any]]
    ) -> ProjectModel:
        return await update_project(db=db, db_obj=db_obj, obj_in=obj_in)

    async def remove(self, db: AsyncSession, *, id: UUID, tenant_id: UUID) -> ProjectModel | None:
        # Pass tenant_id to underlying function
        return await delete_project(db=db, project_id=id, tenant_id=tenant_id)

    # Add method to get participants
    async def get_participants(
        self, db: AsyncSession, *, project_id: UUID, tenant_id: UUID
    ) -> List[User]:
        return await get_participants_for_project(db=db, project_id=project_id, tenant_id=tenant_id)

# Removed model from instantiation
project = CRUDProject() 