from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, Table, Column, String, DateTime, MetaData, insert
from sqlalchemy.dialects.postgresql import insert
from uuid import UUID
from sqlalchemy.future import select
from typing import Any, Dict, Optional, Union, List
from datetime import datetime, timedelta
from sqlalchemy.engine import Row
from sqlalchemy.orm import selectinload, joinedload, Query

from app.models.user import User as UserModel
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import create_access_token
from app.models.project import Project as ProjectModel
from app.schemas.project import ProjectRead
from app.models.goal import Goal as GoalModel
from app.schemas.goal import GoalRead
from app.db.base_class import Base

async def get_user(db: AsyncSession, user_id: UUID) -> UserModel | None:
    result = await db.execute(select(UserModel).filter(UserModel.id == user_id))
    return result.scalar_one_or_none()

async def get_user_by_email(db: AsyncSession, *, email: str) -> Optional[UserModel]:
    statement = select(UserModel).where(UserModel.email == email)
    result = await db.execute(statement)
    return result.scalar_one_or_none()

async def get_user_by_auth_id(db: AsyncSession, auth_provider: str, auth_provider_id: str) -> UserModel | None:
    result = await db.execute(
        select(UserModel).filter(
            UserModel.auth_provider == auth_provider,
            UserModel.auth_provider_id == auth_provider_id
        )
    )
    return result.scalar_one_or_none()

async def create_user(db: AsyncSession, *, obj_in: UserCreate, tenant_id: UUID, user_id: Optional[UUID] = None) -> UserModel:
    create_data = obj_in.model_dump()
    create_data['tenant_id'] = tenant_id
    
    # Use custom ID if provided
    if user_id:
        create_data['id'] = user_id

    db_obj = UserModel(**create_data)
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_user(db: AsyncSession, *, db_obj: UserModel, obj_in: Union[UserUpdate, Dict[str, Any]]) -> UserModel:
    """Updates a user SQLAlchemy model instance."""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        # Get data from the Pydantic model
        update_data = obj_in.model_dump(exclude_unset=True) 
    
    # Handle password separately if it's provided
    if "password" in update_data:
        from app.core.auth import get_password_hash
        hashed_password = get_password_hash(update_data.pop("password"))
        setattr(db_obj, "hashed_password", hashed_password)
    
    # Iterate over the fields in the update data
    for field, value in update_data.items():
        # Check if the SQLAlchemy model has this attribute
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)
        # else: handle unexpected fields?
            
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def get_projects_for_user(
    db: AsyncSession, *, user_id: UUID, tenant_id: UUID, user_team_id: Optional[UUID], limit: int = 100
) -> List[ProjectModel]:
    """Fetches projects associated with a user (e.g., owned by their team)."""
    if not user_team_id:
        return []
        
    stmt = (
        select(ProjectModel)
        # Ensure this uses owning_team_id
        .where(ProjectModel.owning_team_id == user_team_id, ProjectModel.tenant_id == tenant_id)
        .limit(limit) 
        .order_by(ProjectModel.name) # Add ordering for consistency
    )
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_goals_for_user(
    db: AsyncSession, *, user_id: UUID, tenant_id: UUID, user_team_id: Optional[UUID], limit: int = 100
) -> List[Row]:
    """Fetches goals associated with a user (e.g., linked to projects owned by their team)."""
    if not user_team_id:
        return []
        
    # Fetch distinct goals linked to projects owned by the user's team
    # Select specific columns excluding JSON to allow DISTINCT
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
        .order_by(GoalModel.title) # Add ordering
    )
    result = await db.execute(stmt)
    return result.all() # Returns list of Row objects

class CRUDUser():
    async def get(self, db: AsyncSession, id: UUID, *, options: Optional[List] = None) -> UserModel | None:
        """Gets a single user by ID, optionally loading relationships."""
        stmt = select(UserModel).where(UserModel.id == id)
        if options:
            stmt = stmt.options(*options)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
        
    async def update_last_login(self, db: AsyncSession, *, user_id: UUID) -> None:
        """Update the last login timestamp for a user."""
        from datetime import datetime, timezone
        stmt = (
            update(UserModel)
            .where(UserModel.id == user_id)
            .values(last_login_at=datetime.now(timezone.utc))
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()

    async def get_by_email(self, db: AsyncSession, *, email: str) -> Optional[UserModel]:
        # TODO: Add relationship loading option?
        return await get_user_by_email(db, email=email)
        
    async def get_by_email_and_tenant(self, db: AsyncSession, *, email: str, tenant_id: UUID) -> Optional[UserModel]:
        """Get a user by email within a specific tenant."""
        stmt = select(UserModel).where(
            UserModel.email == email,
            UserModel.tenant_id == tenant_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_auth_id(self, db: AsyncSession, auth_provider: str, auth_provider_id: str) -> UserModel | None:
        return await get_user_by_auth_id(db, auth_provider=auth_provider, auth_provider_id=auth_provider_id)

    async def create(self, db: AsyncSession, *, obj_in: UserCreate, tenant_id: UUID, user_id: Optional[UUID] = None) -> UserModel:
        return await create_user(db=db, obj_in=obj_in, tenant_id=tenant_id, user_id=user_id)

    async def update(self, db: AsyncSession, *, db_obj: UserModel, obj_in: Union[UserUpdate, Dict[str, Any]]) -> UserModel:
        return await update_user(db=db, db_obj=db_obj, obj_in=obj_in)

    async def upsert_by_email(
        self, db: AsyncSession, *, obj_in: UserCreate, tenant_id: UUID
    ) -> UserModel:
        db_user = await self.get_by_email(db, email=obj_in.email)
        if db_user:
            print(f"Updating existing user: {obj_in.email}")
            update_data = obj_in.model_dump(exclude_unset=True)
            # If manager_id/team_id are None in obj_in, don't overwrite potentially existing ones
            if 'manager_id' in update_data and update_data['manager_id'] is None:
                 del update_data['manager_id']
            if 'team_id' in update_data and update_data['team_id'] is None:
                 del update_data['team_id']
            return await self.update(db, db_obj=db_user, obj_in=update_data)
        else:
            print(f"Creating new user: {obj_in.email}")
            # Pass tenant_id explicitly to create
            return await self.create(db, obj_in=obj_in, tenant_id=tenant_id)

    async def upsert_by_auth(
        self, db: AsyncSession, *, obj_in: UserCreate, tenant_id: UUID
    ) -> UserModel:
        """Find user by auth provider ID, update if found, else create."""
        # First, look for existing user based on provider and provider_id
        stmt = select(UserModel).where(
            UserModel.auth_provider == obj_in.auth_provider, 
            UserModel.auth_provider_id == obj_in.auth_provider_id
        )
        result = await db.execute(stmt)
        db_user = result.scalar_one_or_none()

        if db_user:
            # User exists with same auth provider, update required fields
            print(f"Updating user via auth: {obj_in.email}")
            update_data = obj_in.model_dump(exclude_unset=True)
            return await self.update(db, db_obj=db_user, obj_in=update_data)
        else:
            # Check if user exists with the same email
            db_user_email = await self.get_by_email(db, email=obj_in.email)
            if db_user_email:
                # User exists with same email but different auth credentials
                # Update the user with new auth credentials
                print(f"Updating existing user with new auth credentials: {obj_in.email}")
                update_data = obj_in.model_dump(exclude_unset=True)
                return await self.update(db, db_obj=db_user_email, obj_in=update_data)
            else:
                # User does not exist, create them
                print(f"Creating new user via auth: {obj_in.email}")
                # Pass tenant_id explicitly to create
                return await self.create(db, obj_in=obj_in, tenant_id=tenant_id)

    async def get_projects(self, db: AsyncSession, *, user_id: UUID, tenant_id: UUID, user_team_id: Optional[UUID]) -> List[ProjectModel]:
        return await get_projects_for_user(db=db, user_id=user_id, tenant_id=tenant_id, user_team_id=user_team_id)

    async def get_goals(self, db: AsyncSession, *, user_id: UUID, tenant_id: UUID, user_team_id: Optional[UUID]) -> List[Row]:
        return await get_goals_for_user(db=db, user_id=user_id, tenant_id=tenant_id, user_team_id=user_team_id)

    async def get_by_refresh_token(self, db: AsyncSession, *, refresh_token: str) -> Optional[UserModel]:
        """Finds a user by their stored Google refresh token."""
        result = await db.execute(
            select(UserModel).where(UserModel.google_refresh_token == refresh_token)
        )
        return result.scalar_one_or_none()
        
    async def add_to_token_blacklist(self, db: AsyncSession, *, user_id: UUID, token: str) -> bool:
        """
        Add a JWT token to the blacklist.
        
        Args:
            db: Database session
            user_id: User ID associated with the token
            token: The JWT token to blacklist
            
        Returns:
            True if successfully added to blacklist
        """
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
        # Set expiration to 24 hours for demo purposes
        # In a real implementation, extract expiry from token
        stmt = insert(token_blacklist).values(
            token=token,
            user_id=str(user_id),
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        
        await db.execute(stmt)
        await db.commit()
        return True

    async def get_participating_project_ids(self, db: AsyncSession, *, user_id: UUID) -> List[UUID]:
        """Returns a list of project IDs the user is participating in."""
        # Import the association table where it's used
        from app.models.project import project_participants
        
        stmt = (
            select(project_participants.c.project_id)
            .where(project_participants.c.user_id == user_id)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

user = CRUDUser()