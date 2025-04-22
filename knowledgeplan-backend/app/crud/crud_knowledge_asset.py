from typing import Any, Dict, Optional, List, Union
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update
from sqlalchemy.orm import selectinload

from app.models.knowledge_asset import KnowledgeAsset as KnowledgeAssetModel, KnowledgeAssetTypeEnum
from app.models.user import User
from app.schemas.knowledge_asset import KnowledgeAssetCreate, KnowledgeAssetUpdate, NoteCreate


# --- Standalone CRUD Functions --- 

async def get_knowledge_asset(db: AsyncSession, asset_id: UUID) -> KnowledgeAssetModel | None:
    """Gets a single knowledge asset by ID."""
    result = await db.execute(select(KnowledgeAssetModel).filter(KnowledgeAssetModel.id == asset_id))
    return result.scalar_one_or_none()

async def get_multi_knowledge_asset(
    db: AsyncSession, *, skip: int = 0, limit: int = 100
) -> List[KnowledgeAssetModel]:
    """Gets multiple knowledge assets with pagination."""
    result = await db.execute(select(KnowledgeAssetModel).offset(skip).limit(limit).order_by(KnowledgeAssetModel.created_at.desc()))
    return result.scalars().all()

async def get_multi_knowledge_asset_by_project(
    db: AsyncSession, *, tenant_id: UUID, project_id: UUID, skip: int = 0, limit: int = 100
) -> List[KnowledgeAssetModel]:
    """Retrieves knowledge assets associated with a specific project."""
    result = await db.execute(
        select(KnowledgeAssetModel)
        .where(KnowledgeAssetModel.tenant_id == tenant_id, KnowledgeAssetModel.project_id == project_id)
        .order_by(KnowledgeAssetModel.created_at.desc()) # Show newest first
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def create_knowledge_asset(
    db: AsyncSession, *, obj_in: KnowledgeAssetCreate, tenant_id: UUID, creator_id: UUID
) -> KnowledgeAssetModel:
    """Creates a new knowledge asset associated with a tenant and creator."""
    create_data = obj_in.model_dump()
    db_obj = KnowledgeAssetModel(
        **create_data,
        tenant_id=tenant_id,
        created_by_user_id=creator_id
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def update_knowledge_asset(
    db: AsyncSession, *, db_obj: KnowledgeAssetModel, obj_in: Union[KnowledgeAssetUpdate, Dict[str, Any]]
) -> KnowledgeAssetModel:
    """Updates a knowledge asset SQLAlchemy model instance."""
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        if hasattr(db_obj, field):
            setattr(db_obj, field, value)

    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj

async def delete_knowledge_asset(db: AsyncSession, *, asset_id: UUID) -> KnowledgeAssetModel | None:
    """Deletes a knowledge asset by ID."""
    db_obj = await get_knowledge_asset(db, asset_id=asset_id)
    if db_obj:
        await db.delete(db_obj)
        await db.commit()
    return db_obj

async def get_notes_by_project(
    db: AsyncSession, *, project_id: UUID, tenant_id: UUID, skip: int = 0, limit: int = 100
) -> List[KnowledgeAssetModel]:
    """Get all notes associated with a specific project within a tenant."""
    result = await db.execute(
        select(KnowledgeAssetModel)
        .options(selectinload(KnowledgeAssetModel.created_by))
        .where(
            KnowledgeAssetModel.project_id == project_id,
            KnowledgeAssetModel.tenant_id == tenant_id,
            KnowledgeAssetModel.type == KnowledgeAssetTypeEnum.NOTE # Filter specifically for notes
        )
        .order_by(KnowledgeAssetModel.created_at.desc()) # Show newest first
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

async def create_note(
    db: AsyncSession, *, note_in: NoteCreate, owner: User, project_id: UUID
) -> KnowledgeAssetModel:
    """Create a new note linked to a project and owner."""
    db_note = KnowledgeAssetModel(
        **note_in.dict(exclude_unset=True), # Use exclude_unset for optional fields
        tenant_id=owner.tenant_id,
        created_by_user_id=owner.id,
        project_id=project_id,
        type=KnowledgeAssetTypeEnum.NOTE # Explicitly set type
    )
    db.add(db_note)
    await db.commit()
    await db.refresh(db_note)
    return db_note

# --- CRUD Class using Standalone Functions --- 

# Removed inheritance from CRUDBase
class CRUDKnowledgeAsset():
    async def create_with_tenant_and_creator(
        self, db: AsyncSession, *, obj_in: KnowledgeAssetCreate, tenant_id: UUID, creator_id: UUID
    ) -> KnowledgeAssetModel:
        """Creates a knowledge asset, ensuring tenant_id and creator_id are set."""
        return await create_knowledge_asset(
            db=db, obj_in=obj_in, tenant_id=tenant_id, creator_id=creator_id
        )

    async def get_multi_by_project(
        self, db: AsyncSession, *, tenant_id: UUID, project_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[KnowledgeAssetModel]:
        """Retrieves knowledge assets (e.g., notes) associated with a specific project."""
        return await get_multi_knowledge_asset_by_project(
            db=db, tenant_id=tenant_id, project_id=project_id, skip=skip, limit=limit
        )

    # Add wrappers for standard CRUD operations
    async def get(self, db: AsyncSession, id: UUID) -> KnowledgeAssetModel | None:
        return await get_knowledge_asset(db, asset_id=id)
        
    async def get_multi(
        self, db: AsyncSession, *, skip: int = 0, limit: int = 100
    ) -> List[KnowledgeAssetModel]:
        return await get_multi_knowledge_asset(db=db, skip=skip, limit=limit)

    async def create(self, db: AsyncSession, *, obj_in: KnowledgeAssetCreate, tenant_id: UUID, creator_id: UUID) -> KnowledgeAssetModel:
        # Assuming create always needs tenant_id and creator_id like the specific method
        return await create_knowledge_asset(db=db, obj_in=obj_in, tenant_id=tenant_id, creator_id=creator_id)

    async def update(
        self, db: AsyncSession, *, db_obj: KnowledgeAssetModel, obj_in: Union[KnowledgeAssetUpdate, Dict[str, Any]]
    ) -> KnowledgeAssetModel:
        return await update_knowledge_asset(db=db, db_obj=db_obj, obj_in=obj_in)

    async def remove(self, db: AsyncSession, *, id: UUID) -> KnowledgeAssetModel | None:
        return await delete_knowledge_asset(db=db, asset_id=id)

# Removed model from instantiation
knowledge_asset = CRUDKnowledgeAsset() 