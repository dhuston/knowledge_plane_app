from typing import Any, Dict, Generic, List, Optional, Type, TypeVar, Union
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.future import select

from app.db.base_class import Base
from app.core.tenant_context import TenantContext
from app.core.tenant_filter import tenant_aware_query
from app.core.tenant_validation import (
    validate_create_operation,
    validate_update_operation,
    validate_delete_operation,
    TenantAccessViolationError
)

ModelType = TypeVar("ModelType", bound=Base)


class CRUDBase(Generic[ModelType]):
    """
    Base CRUD class with tenant-aware data access operations.
    """
    
    def __init__(self, model: Type[ModelType]):
        """
        Initialize with SQLAlchemy model class.
        """
        self.model = model
    
    @tenant_aware_query
    async def get(
        self, 
        db: AsyncSession, 
        tenant_context: TenantContext,
        id: Any
    ) -> Optional[ModelType]:
        """
        Get a single object by ID, filtered by tenant.
        
        Args:
            db: Database session
            tenant_context: Current tenant context
            id: Object ID
            
        Returns:
            Object if found, None otherwise
        """
        query = select(self.model).where(self.model.id == id)
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    @tenant_aware_query
    async def get_multi(
        self,
        db: AsyncSession,
        tenant_context: TenantContext,
        *,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """
        Get multiple objects, filtered by tenant.
        
        Args:
            db: Database session
            tenant_context: Current tenant context
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of objects
        """
        query = select(self.model).offset(skip).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
    
    async def create(
        self,
        db: AsyncSession,
        tenant_context: TenantContext,
        *,
        obj_in: Dict[str, Any]
    ) -> ModelType:
        """
        Create a new object with tenant ID validation.
        
        Args:
            db: Database session
            tenant_context: Current tenant context
            obj_in: Object data dictionary
            
        Returns:
            Created object
            
        Raises:
            TenantAccessViolationError: If tenant validation fails
        """
        create_data = obj_in.copy()
        
        # Ensure tenant_id is set correctly
        create_data["tenant_id"] = tenant_context.tenant_id
        
        # Validate the create operation
        await validate_create_operation(db, self.model, create_data, tenant_context)
        
        # Create object
        db_obj = self.model(**create_data)
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def update(
        self,
        db: AsyncSession,
        tenant_context: TenantContext,
        *,
        db_obj: ModelType,
        obj_in: Union[Dict[str, Any], Any]
    ) -> ModelType:
        """
        Update an object with tenant validation.
        
        Args:
            db: Database session
            tenant_context: Current tenant context
            db_obj: Existing database object
            obj_in: Update data (dict or Pydantic model)
            
        Returns:
            Updated object
            
        Raises:
            TenantAccessViolationError: If tenant validation fails
        """
        # Convert input to dict if it's not already
        update_data = obj_in if isinstance(obj_in, dict) else obj_in.model_dump(exclude_unset=True)
        
        # Validate the update operation
        obj_id = db_obj.id
        await validate_update_operation(db, self.model, obj_id, update_data, tenant_context)
        
        # Update object
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
    
    async def delete(
        self,
        db: AsyncSession,
        tenant_context: TenantContext,
        *,
        id: Any
    ) -> ModelType:
        """
        Delete an object with tenant validation.
        
        Args:
            db: Database session
            tenant_context: Current tenant context
            id: Object ID
            
        Returns:
            Deleted object
            
        Raises:
            TenantAccessViolationError: If tenant validation fails
        """
        # Validate the delete operation
        await validate_delete_operation(db, self.model, id, tenant_context)
        
        # Get the object
        obj = await db.get(self.model, id)
        
        # Delete it
        await db.delete(obj)
        await db.commit()
        
        return obj