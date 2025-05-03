import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Completely removed reference to app.crud.base
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate, TenantUpdate

class CRUDTenant(): # Remove inheritance from CRUDBase
    async def get(self, db: AsyncSession, *, id: uuid.UUID) -> Optional[Tenant]:
        """Get a tenant by ID."""
        statement = select(Tenant).where(Tenant.id == id)
        result = await db.execute(statement)
        return result.scalar_one_or_none()
        
    async def get_by_domain(self, db: AsyncSession, *, domain: str) -> Optional[Tenant]:
        """Fetches a tenant by its domain."""
        if not domain:
            return None
        statement = select(Tenant).where(Tenant.domain == domain)
        result = await db.execute(statement)
        return result.scalar_one_or_none()
        
    async def get_by_name(self, db: AsyncSession, *, name: str) -> Optional[Tenant]:
        """Get a tenant by name."""
        statement = select(Tenant).where(Tenant.name == name)
        result = await db.execute(statement)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: TenantCreate) -> Tenant:
        """Creates a new tenant."""
        # Extract data from schema
        create_data = obj_in.model_dump()
        
        # Create tenant object
        db_obj = Tenant(
            id=uuid.uuid4(),  # Generate ID here if not handled by Base/default
            **create_data
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj
        
    async def create_demo_tenant(self, db: AsyncSession, *, name: str, domain: Optional[str] = None) -> Tenant:
        """
        Create a demo tenant with predefined settings.
        
        Args:
            db: Database session
            name: Tenant name
            domain: Optional domain name
            
        Returns:
            The created tenant
        """
        # If domain not specified, create a safe domain based on name
        if not domain:
            # Convert spaces to hyphens, remove special chars, lowercase
            import re
            safe_name = re.sub(r'[^a-zA-Z0-9]', '-', name.lower())
            safe_name = '-'.join(filter(None, safe_name.split('-')))
            domain = f"{safe_name}.demo.biosphere.ai"
        
        # Create tenant data
        tenant_data = TenantCreate(
            name=name,
            domain=domain,
            is_active=True,
            settings={
                "demo_mode": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Create the tenant
        return await self.create(db=db, obj_in=tenant_data)

    async def update(self, db: AsyncSession, *, db_obj: Tenant, obj_in: Union[TenantUpdate, Dict[str, Any]]) -> Tenant:
        """Update a tenant."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.model_dump(exclude_unset=True)
            
        for field in update_data:
            if hasattr(db_obj, field):
                setattr(db_obj, field, update_data[field])
                
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

tenant = CRUDTenant() # Instantiate the class 