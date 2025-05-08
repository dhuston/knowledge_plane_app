"""
CRUD operations for User model using the CRUDBase class.
Demonstrates how to extend the base CRUD operations with model-specific functionality.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, Table, Column, String, DateTime, MetaData, insert
from sqlalchemy.dialects.postgresql import insert
from uuid import UUID
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union
from sqlalchemy.engine import Row
from sqlalchemy.orm import selectinload, joinedload, Query

from app.models.user import User as UserModel
from app.schemas.user import UserCreate, UserUpdate
from app.core.token import create_access_token
from app.models.project import Project as ProjectModel
from app.models.goal import Goal as GoalModel
from app.core.tenant_service import TenantContext
from app.crud.crud_base import CRUDBase


class CRUDUser(CRUDBase[UserModel]):
    """
    CRUD operations for User model, extending the base CRUD operations.
    """
    
    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[UserModel]:
        """Get a user by email."""
        stmt = select(self.model).where(self.model.email == email)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def get_by_email_and_tenant(
        self, 
        db: AsyncSession, 
        *, 
        email: str, 
        tenant_id: UUID
    ) -> Optional[UserModel]:
        """Get a user by email within a specific tenant."""
        stmt = select(self.model).where(
            self.model.email == email,
            self.model.tenant_id == tenant_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_auth_id(
        self, 
        db: AsyncSession, 
        auth_provider: str, 
        auth_provider_id: str
    ) -> Optional[UserModel]:
        """Get a user by authentication provider and ID."""
        stmt = select(self.model).where(
            self.model.auth_provider == auth_provider,
            self.model.auth_provider_id == auth_provider_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def create_with_tenant(
        self, 
        db: AsyncSession, 
        *, 
        obj_in: UserCreate, 
        tenant_id: UUID,
        is_demo: bool = False,
        auth_provider: str = "password", 
        user_id: Optional[UUID] = None
    ) -> UserModel:
        """Create a new user with tenant ID."""
        create_data = obj_in.model_dump() if hasattr(obj_in, "model_dump") else dict(obj_in)
        
        # Add tenant ID and optional parameters
        create_data["tenant_id"] = tenant_id
        
        if is_demo:
            create_data["is_demo"] = True
            
        if auth_provider and "auth_provider" not in create_data:
            create_data["auth_provider"] = auth_provider
            
        # Use custom ID if provided
        if user_id:
            create_data["id"] = user_id

        # Handle password field if present
        if "password" in create_data:
            from app.core.auth import get_password_hash
            hashed_password = get_password_hash(create_data.pop("password"))
            create_data["hashed_password"] = hashed_password

        # Create tenant context for base method
        tenant_context = TenantContext(tenant_id=tenant_id)
        
        # Use base class to create user
        return await super().create(db, tenant_context=tenant_context, obj_in=create_data)
    
    async def update_last_login(self, db: AsyncSession, *, user_id: UUID) -> None:
        """Update the last login timestamp for a user."""
        stmt = (
            update(self.model)
            .where(self.model.id == user_id)
            .values(last_login_at=datetime.now(datetime.timezone.utc))
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()
    
    async def upsert_by_email(
        self, 
        db: AsyncSession, 
        *, 
        obj_in: UserCreate, 
        tenant_id: UUID
    ) -> UserModel:
        """Find user by email, update if found, else create."""
        db_user = await self.get_by_email(db, email=obj_in.email)
        
        if db_user:
            # User exists, update
            update_data = obj_in.model_dump(exclude_unset=True) if hasattr(obj_in, "model_dump") else dict(obj_in)
            
            # Don't overwrite existing values with None
            if "manager_id" in update_data and update_data["manager_id"] is None:
                del update_data["manager_id"]
            if "team_id" in update_data and update_data["team_id"] is None:
                del update_data["team_id"]
                
            # Create tenant context for base method
            tenant_context = TenantContext(tenant_id=tenant_id)
            
            return await super().update(
                db, 
                tenant_context=tenant_context,
                db_obj=db_user, 
                obj_in=update_data
            )
        else:
            # User doesn't exist, create
            return await self.create_with_tenant(db, obj_in=obj_in, tenant_id=tenant_id)

    async def get_projects(
        self, 
        db: AsyncSession, 
        *, 
        user_id: UUID, 
        tenant_id: UUID, 
        user_team_id: Optional[UUID],
        limit: int = 100
    ) -> List[ProjectModel]:
        """Fetches projects associated with a user (e.g., owned by their team)."""
        if not user_team_id:
            return []
            
        stmt = (
            select(ProjectModel)
            .where(ProjectModel.owning_team_id == user_team_id, ProjectModel.tenant_id == tenant_id)
            .limit(limit) 
            .order_by(ProjectModel.name)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def get_goals(
        self, 
        db: AsyncSession, 
        *, 
        user_id: UUID, 
        tenant_id: UUID, 
        user_team_id: Optional[UUID],
        limit: int = 100
    ) -> List[Row]:
        """Fetches goals associated with a user (e.g., linked to projects owned by their team)."""
        if not user_team_id:
            return []
            
        # Fetch distinct goals linked to projects owned by the user's team
        stmt = (
            select(
                GoalModel.id,
                GoalModel.tenant_id,
                GoalModel.title,
                GoalModel.description,
                GoalModel.type,
                GoalModel.parent_id,
                GoalModel.status,
                GoalModel.progress,
                GoalModel.due_date,
                # Exclude GoalModel.properties
                GoalModel.created_at,
                GoalModel.updated_at
            ).distinct()
            .join(ProjectModel, GoalModel.id == ProjectModel.goal_id) 
            .where(
                ProjectModel.owning_team_id == user_team_id, 
                ProjectModel.tenant_id == tenant_id, 
            )
            .limit(limit)
            .order_by(GoalModel.title)
        )
        result = await db.execute(stmt)
        return result.all()

    async def get_participating_project_ids(
        self, 
        db: AsyncSession, 
        *, 
        user_id: UUID
    ) -> List[UUID]:
        """Returns a list of project IDs the user is participating in."""
        # Import the association table where it's used
        from app.models.project import project_participants
        
        stmt = (
            select(project_participants.c.project_id)
            .where(project_participants.c.user_id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

    async def add_to_token_blacklist(
        self, 
        db: AsyncSession, 
        *, 
        user_id: UUID, 
        token: str
    ) -> bool:
        """Add a JWT token to the blacklist."""
        # Create token_blacklist table if it doesn't exist
        metadata = MetaData()
        token_blacklist = Table(
            "token_blacklist", 
            metadata,
            Column("token", String, primary_key=True),
            Column("user_id", String, nullable=False),
            Column("created_at", DateTime, nullable=False),
            Column("expires_at", DateTime, nullable=False),
        )
        
        # Make sure table exists
        await db.execute(
            """
            CREATE TABLE IF NOT EXISTS token_blacklist (
                token VARCHAR(1000) PRIMARY KEY,
                user_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL
            );
            """
        )
        
        # Insert the token into the blacklist
        stmt = insert(token_blacklist).values(
            token=token,
            user_id=str(user_id),
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        
        await db.execute(stmt)
        await db.commit()
        return True


# Create global instance
user = CRUDUser(UserModel)