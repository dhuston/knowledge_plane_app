"""
Decorators for tenant-aware functions and database operations.
"""
import logging
import functools
import inspect
from typing import Any, Callable, TypeVar, cast, Optional, Type
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql.selectable import Selectable

from app.core.tenant_service import TenantContext, get_tenant_service, TenantException
from app.db.base_class import Base

logger = logging.getLogger(__name__)

# Type variables for function signatures
F = TypeVar('F', bound=Callable[..., Any])
ModelType = TypeVar("ModelType", bound=Base)


def tenant_aware_query(func: F) -> F:
    """
    Decorator that applies tenant filtering to SQLAlchemy queries.
    
    Automatically filters queries by tenant_id when a model has a tenant_id column.
    Must be applied to methods that have parameters named 'db' and 'tenant_context'.
    
    Example:
        @tenant_aware_query
        async def get_multi(self, db: AsyncSession, tenant_context: TenantContext):
            query = select(self.model)
            result = await db.execute(query)
            return result.scalars().all()
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract db session and tenant context from args/kwargs
        func_signature = inspect.signature(func)
        parameters = list(func_signature.parameters.items())
        
        db = None
        tenant_context = None
        
        # Find db and tenant_context in kwargs or positional args
        if 'db' in kwargs:
            db = kwargs['db']
        if 'tenant_context' in kwargs:
            tenant_context = kwargs['tenant_context']
            
        # If not found in kwargs, look in positional args
        if db is None or tenant_context is None:
            for i, (param_name, param) in enumerate(parameters):
                if i < len(args):  # Check if we have an arg for this position
                    if param_name == 'db':
                        db = args[i]
                    elif param_name == 'tenant_context':
                        tenant_context = args[i]
        
        # Create default tenant context if not provided
        if tenant_context is None:
            from app.core.tenant_service import tenant_context as global_tenant_context
            tenant_context = global_tenant_context
        
        # Get model class from self.model
        if args and hasattr(args[0], 'model'):
            model_class = args[0].model
        else:
            # If we can't determine the model class, just call the original function
            logger.debug("Could not determine model class, skipping tenant filtering")
            return await func(*args, **kwargs)
            
        # Ensure tenant context is initialized
        if not tenant_context.initialized:
            logger.warning("Tenant context not initialized for tenant-aware query")
            raise TenantException("No tenant context available")
            
        # Check if model has tenant_id attribute
        if not hasattr(model_class, 'tenant_id'):
            # Model doesn't have tenant filtering, just call the original function
            logger.debug(f"Model {model_class.__name__} has no tenant_id, skipping tenant filtering")
            return await func(*args, **kwargs)
            
        # Get the tenant service
        tenant_service = get_tenant_service()
            
        # Keep track of the original execute method
        original_execute = db.execute
        
        # Create a wrapper for the execute method that adds tenant filtering
        async def tenant_filtered_execute(statement, *inner_args, **inner_kwargs):
            # Only filter Select statements
            if isinstance(statement, Select):
                try:
                    # Apply tenant filtering using the tenant service
                    filtered_statement = tenant_service.apply_tenant_filter(statement, model_class)
                    logger.debug(f"Applied tenant filter to query for model {model_class.__name__}")
                    return await original_execute(filtered_statement, *inner_args, **inner_kwargs)
                except Exception as e:
                    logger.error(f"Error applying tenant filter: {str(e)}")
                    # Fall back to original statement on error
                    return await original_execute(statement, *inner_args, **inner_kwargs)
            else:
                # Non-Select statements pass through unchanged
                return await original_execute(statement, *inner_args, **inner_kwargs)
        
        try:
            # Replace the execute method with our tenant-aware version
            db.execute = tenant_filtered_execute
            # Call the original function
            return await func(*args, **kwargs)
        finally:
            # Always restore the original execute method
            db.execute = original_execute
    
    return cast(F, wrapper)


def register_tenant_events():
    """
    Register event listeners for tenant-aware operations.
    This is a placeholder that might be expanded in the future.
    """
    logger.info("Tenant event registration complete")
    return