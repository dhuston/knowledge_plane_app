"""
Central service for tenant operations and validation.
Consolidates tenant-related functionality from multiple modules.
"""
import logging
from typing import Any, Dict, Optional, Type, TypeVar, Generic, List, Union
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import inspect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.expression import Select

from app.core.token import get_tenant_id_from_token
from app.crud.crud_tenant import tenant as tenant_crud

# Define logger
logger = logging.getLogger(__name__)

# Generic type for database models
ModelType = TypeVar("ModelType")


class TenantException(Exception):
    """Base class for all tenant-related exceptions."""
    def __init__(self, message: str, status_code: int = 403):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class TenantContext:
    """
    A simplified tenant context container.
    Stores tenant information for the current request.
    """
    
    def __init__(self, tenant_id: Optional[UUID] = None, tenant_name: Optional[str] = None):
        self.tenant_id = tenant_id
        self.tenant_name = tenant_name
        self.initialized = tenant_id is not None
    
    def reset(self):
        """Reset context to uninitialized state."""
        self.tenant_id = None
        self.tenant_name = None
        self.initialized = False


class TenantService:
    """
    Central service for tenant operations.
    Consolidates functionality from tenant_context, tenant_filter, and tenant_validation.
    """
    
    def __init__(self, tenant_context: TenantContext):
        self.context = tenant_context

    def ensure_tenant_initialized(self):
        """
        Check if tenant context is initialized.
        Raises TenantException if not initialized.
        """
        if not self.context.initialized:
            raise TenantException(
                message="No tenant context available. Authentication required.",
                status_code=status.HTTP_401_UNAUTHORIZED
            )
    
    def extract_tenant_from_token(self, token: str) -> Optional[UUID]:
        """
        Extract tenant ID from JWT token.
        
        Args:
            token: JWT token from request
            
        Returns:
            UUID: Tenant ID if present, None otherwise
        """
        return get_tenant_id_from_token(token)
    
    def validate_tenant_access(self, obj: Any) -> bool:
        """
        Validate that the current tenant has access to an object.
        
        Args:
            obj: Database model object to check
            
        Returns:
            bool: True if access is allowed
            
        Raises:
            TenantException: If access is denied
        """
        # Ensure tenant context is initialized
        self.ensure_tenant_initialized()
        
        # If object doesn't have tenant_id, access is allowed
        if not hasattr(obj, "tenant_id"):
            return True
        
        # If object tenant matches current tenant, access is allowed
        if obj.tenant_id == self.context.tenant_id:
            return True
        
        # Access denied
        logger.warning(
            f"Tenant access violation: {self.context.tenant_id} attempted to access "
            f"object with tenant_id {obj.tenant_id}"
        )
        raise TenantException(
            message="Access denied to resource from another tenant",
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    def validate_tenant_ids(self, tenant_ids: List[UUID]) -> bool:
        """
        Validate that a list of tenant IDs all match the current tenant.
        
        Args:
            tenant_ids: List of tenant IDs to check
            
        Returns:
            bool: True if all tenant IDs match current tenant
            
        Raises:
            TenantException: If any tenant ID doesn't match
        """
        self.ensure_tenant_initialized()
        
        for tenant_id in tenant_ids:
            if tenant_id != self.context.tenant_id:
                logger.warning(
                    f"Tenant mismatch: Expected {self.context.tenant_id}, got {tenant_id}"
                )
                raise TenantException(
                    message="Access denied to resource from another tenant",
                    status_code=status.HTTP_403_FORBIDDEN
                )
        
        return True
    
    def apply_tenant_filter(self, query: Select, model_class: Type[ModelType]) -> Select:
        """
        Apply tenant filtering to a SQLAlchemy query.
        
        Args:
            query: SQLAlchemy select query
            model_class: Model class being queried
            
        Returns:
            Modified query with tenant filter applied
        """
        self.ensure_tenant_initialized()
        
        # Check if model has tenant_id column
        if hasattr(model_class, "tenant_id"):
            # Add tenant filter to query
            return query.filter(model_class.tenant_id == self.context.tenant_id)
        
        # No tenant filtering needed
        return query
    
    async def validate_create_operation(
        self,
        db: AsyncSession,
        obj_in: Dict[str, Any],
        model_class: Type[ModelType]
    ) -> Dict[str, Any]:
        """
        Validate object creation for tenant isolation.
        
        Args:
            db: Database session
            obj_in: Object data for creation
            model_class: Model class being created
            
        Returns:
            Modified object data with tenant_id added if needed
        """
        self.ensure_tenant_initialized()
        
        # Create a mutable copy
        result = dict(obj_in)
        
        # Check if model has tenant_id column
        if hasattr(model_class, "tenant_id"):
            # Add tenant_id if not present or validate existing one
            if "tenant_id" not in result:
                result["tenant_id"] = self.context.tenant_id
            elif result["tenant_id"] != self.context.tenant_id:
                logger.warning(
                    f"Create operation attempted with different tenant_id: "
                    f"Expected {self.context.tenant_id}, got {result['tenant_id']}"
                )
                raise TenantException(
                    message="Cannot create object for different tenant",
                    status_code=status.HTTP_403_FORBIDDEN
                )
        
        return result
    
    async def get_tenant_by_id(self, db: AsyncSession, tenant_id: UUID):
        """
        Get tenant by ID.
        
        Args:
            db: Database session
            tenant_id: Tenant ID to look up
            
        Returns:
            Tenant object if found
            
        Raises:
            TenantException: If tenant not found
        """
        tenant = await tenant_crud.get(db, id=tenant_id)
        if not tenant:
            raise TenantException(
                message=f"Tenant with ID {tenant_id} not found", 
                status_code=status.HTTP_404_NOT_FOUND
            )
        return tenant


# Global tenant context instance
# Used for request-scoped tenant information
tenant_context = TenantContext()


# Create a global tenant service instance using the global context
def get_tenant_service() -> TenantService:
    """Get the tenant service instance."""
    return TenantService(tenant_context)