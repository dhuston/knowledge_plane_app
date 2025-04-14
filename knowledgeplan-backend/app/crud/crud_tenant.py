import uuid
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Completely removed reference to app.crud.base
from app.models.tenant import Tenant
from app.schemas.tenant import TenantCreate # Only need TenantCreate here for now

class CRUDTenant(): # Remove inheritance from CRUDBase
    async def get_by_domain(self, db: AsyncSession, *, domain: str) -> Optional[Tenant]:
        """Fetches a tenant by its domain."""
        statement = select(Tenant).where(Tenant.domain == domain)
        result = await db.execute(statement)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: TenantCreate) -> Tenant:
        """Creates a new tenant."""
        # You might want more sophisticated tenant creation logic here
        # For now, just use the schema data
        db_obj = Tenant(
            id=uuid.uuid4(), # Generate ID here if not handled by Base/default
            name=obj_in.name, 
            domain=obj_in.domain,
            # Add other fields from TenantCreate as needed
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    # Add get, update, delete methods here if needed later, similar to crud_user.py

tenant = CRUDTenant() # Instantiate the class 