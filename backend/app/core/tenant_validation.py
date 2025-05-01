from typing import Any, Dict, List, Optional, Type, TypeVar, Union
import datetime
import uuid
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeMeta

from app.core.tenant_context import TenantContext
from app.db.base_class import Base

T = TypeVar('T', bound=Base)


class TenantAccessViolationError(Exception):
    """Exception raised for tenant access violations."""
    
    def __init__(self, message: str, entity_type: Optional[str] = None, details: Optional[Dict] = None):
        self.message = message
        self.entity_type = entity_type
        self.details = details or {}
        super().__init__(message)


def validate_tenant_access(obj: Any, tenant_context: TenantContext):
    """
    Validate that the object belongs to the current tenant.
    Raises TenantAccessViolationError if not valid.
    """
    if not tenant_context.initialized or tenant_context.tenant_id is None:
        raise TenantAccessViolationError("No active tenant context")
    
    if not hasattr(obj, "tenant_id") or obj.tenant_id is None:
        raise TenantAccessViolationError(
            "Object has no tenant_id attribute", 
            entity_type=getattr(obj, "__tablename__", None)
        )
    
    if obj.tenant_id != tenant_context.tenant_id:
        raise TenantAccessViolationError(
            f"Object belongs to tenant {obj.tenant_id}, not current tenant {tenant_context.tenant_id}",
            entity_type=getattr(obj, "__tablename__", None),
            details={"object_tenant": str(obj.tenant_id), "current_tenant": str(tenant_context.tenant_id)}
        )


async def validate_create_operation(
    db: AsyncSession, 
    model_class: Type[T], 
    data: Dict[str, Any], 
    tenant_context: TenantContext
):
    """
    Validate that a create operation is setting the correct tenant_id.
    Raises TenantAccessViolationError if validation fails.
    """
    if not tenant_context.initialized or tenant_context.tenant_id is None:
        raise TenantAccessViolationError("No active tenant context")
    
    # Ensure tenant_id field exists in the data
    if "tenant_id" not in data:
        raise TenantAccessViolationError(
            "Missing tenant_id in create operation",
            entity_type=model_class.__tablename__
        )
    
    # Check that tenant_id matches current context
    if data["tenant_id"] != tenant_context.tenant_id:
        raise TenantAccessViolationError(
            f"Invalid tenant_id in create operation: {data['tenant_id']} (expected {tenant_context.tenant_id})",
            entity_type=model_class.__tablename__,
            details={"provided_tenant": str(data["tenant_id"]), "current_tenant": str(tenant_context.tenant_id)}
        )


async def validate_update_operation(
    db: AsyncSession, 
    model_class: Type[T], 
    obj_id: Union[UUID, str, int], 
    data: Dict[str, Any], 
    tenant_context: TenantContext
):
    """
    Validate that an update operation is targeting an object from the current tenant.
    Raises TenantAccessViolationError if validation fails.
    """
    if not tenant_context.initialized or tenant_context.tenant_id is None:
        raise TenantAccessViolationError("No active tenant context")
    
    # Fetch the object to verify tenant
    obj = await db.get(model_class, obj_id)
    if obj is None:
        raise TenantAccessViolationError(
            f"Object not found: {obj_id}",
            entity_type=model_class.__tablename__,
            details={"id": str(obj_id)}
        )
    
    # Validate that the object belongs to the current tenant
    validate_tenant_access(obj, tenant_context)
    
    # If tenant_id is being updated, ensure it matches current context
    if "tenant_id" in data and data["tenant_id"] != tenant_context.tenant_id:
        raise TenantAccessViolationError(
            f"Cannot change tenant_id in update operation: {data['tenant_id']}",
            entity_type=model_class.__tablename__,
            details={"id": str(obj_id), "provided_tenant": str(data["tenant_id"])}
        )


async def validate_delete_operation(
    db: AsyncSession, 
    model_class: Type[T], 
    obj_id: Union[UUID, str, int], 
    tenant_context: TenantContext
):
    """
    Validate that a delete operation is targeting an object from the current tenant.
    Raises TenantAccessViolationError if validation fails.
    """
    if not tenant_context.initialized or tenant_context.tenant_id is None:
        raise TenantAccessViolationError("No active tenant context")
    
    # Fetch the object to verify tenant
    obj = await db.get(model_class, obj_id)
    if obj is None:
        raise TenantAccessViolationError(
            f"Object not found: {obj_id}",
            entity_type=model_class.__tablename__,
            details={"id": str(obj_id)}
        )
    
    # Validate that the object belongs to the current tenant
    validate_tenant_access(obj, tenant_context)


class TenantValidationService:
    """
    Service for validating tenant data isolation.
    Used for checking tenant boundaries and generating validation reports.
    """
    
    def __init__(self, tenant_context: TenantContext):
        self.tenant_context = tenant_context
        self.tenant_id = tenant_context.tenant_id if tenant_context.initialized else None
        self.validation_errors = []
    
    def add_error(self, entity_type: str, message: str, details: Optional[Dict] = None):
        """
        Add an error to the validation report.
        """
        self.validation_errors.append({
            "entity_type": entity_type,
            "message": message,
            "details": details or {},
            "timestamp": datetime.datetime.now().isoformat()
        })
    
    async def validate_entity(self, db: AsyncSession, model_class: Type[T], obj_id: UUID):
        """
        Validate that an entity belongs to the current tenant.
        Adds errors to the report but doesn't raise exceptions.
        """
        if not self.tenant_context.initialized or self.tenant_id is None:
            self.add_error(
                model_class.__tablename__,
                "No active tenant context",
                {"id": str(obj_id)}
            )
            return
        
        # Fetch the object to verify tenant
        obj = await db.get(model_class, obj_id)
        if obj is None:
            self.add_error(
                model_class.__tablename__,
                f"Object not found: {obj_id}",
                {"id": str(obj_id)}
            )
            return
        
        # Check tenant_id
        if not hasattr(obj, "tenant_id") or obj.tenant_id is None:
            self.add_error(
                model_class.__tablename__,
                "Object has no tenant_id attribute",
                {"id": str(obj_id)}
            )
        elif obj.tenant_id != self.tenant_id:
            self.add_error(
                model_class.__tablename__,
                f"Object belongs to tenant {obj.tenant_id}, not current tenant {self.tenant_id}",
                {
                    "id": str(obj_id),
                    "object_tenant": str(obj.tenant_id),
                    "current_tenant": str(self.tenant_id)
                }
            )


def create_validation_report(validation_service: TenantValidationService) -> Dict:
    """
    Create a validation report from a validation service.
    """
    return {
        "tenant_id": str(validation_service.tenant_id) if validation_service.tenant_id else None,
        "timestamp": datetime.datetime.now().isoformat(),
        "error_count": len(validation_service.validation_errors),
        "errors": validation_service.validation_errors
    }