# Create initial tenant script for Biosphere Alpha
# This script should be run during initialization to ensure a valid tenant exists
# python -m scripts.create_initial_tenant

import asyncio
import logging
import os
import sys
from uuid import UUID

# Add the parent directory to the path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select

from app.db.session import SessionLocal
from app.models.tenant import Tenant
from app.crud.crud_tenant import tenant as crud_tenant

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# The reference UUID used by the frontend 
STATIC_TENANT_ID = UUID("d3667ea1-079a-434e-84d2-60e84757b5d5")

async def create_default_tenant():
    """Create a default tenant that matches the static ID used by the frontend."""
    logger.info("Starting tenant initialization")
    
    async with SessionLocal() as db:
        try:
            # Check if tenant with static ID already exists
            existing_tenant = await db.execute(
                select(Tenant).where(Tenant.id == STATIC_TENANT_ID)
            )
            if existing_tenant := existing_tenant.scalar_one_or_none():
                logger.info(f"Default tenant already exists: {existing_tenant.name} ({existing_tenant.id})")
                return existing_tenant
            
            # Create a new tenant with the static ID
            logger.info(f"Creating default tenant with ID: {STATIC_TENANT_ID}")
            tenant_obj = Tenant(
                id=STATIC_TENANT_ID,
                name="UltraThink",
                domain="ultrathink.biosphere.ai",
                is_active=True,
                settings={
                    "demo_mode": True,
                    "features": {
                        "advanced_analytics": True,
                        "collaboration": True,
                        "integration_framework": True,
                        "spatial_mapping": True
                    }
                }
            )
            
            db.add(tenant_obj)
            await db.commit()
            await db.refresh(tenant_obj)
            logger.info(f"Successfully created default tenant: {tenant_obj.name} ({tenant_obj.id})")
            return tenant_obj
            
        except Exception as e:
            logger.error(f"Error creating default tenant: {e}")
            await db.rollback()
            raise

async def list_all_tenants():
    """List all tenants in the database."""
    logger.info("Listing all tenants")
    
    async with SessionLocal() as db:
        try:
            # Get all tenants
            result = await db.execute(select(Tenant))
            tenants = result.scalars().all()
            
            if not tenants:
                logger.warning("No tenants found in database")
                return []
                
            logger.info(f"Found {len(tenants)} tenants:")
            for tenant in tenants:
                logger.info(f"  - {tenant.name} (ID: {tenant.id})")
                
            return tenants
            
        except Exception as e:
            logger.error(f"Error listing tenants: {e}")
            raise

async def main():
    """Main function to create default tenant and list all tenants."""
    try:
        # Check connection to database
        logger.info("Checking database connection...")
        async with SessionLocal() as db:
            await db.execute("SELECT 1")
        logger.info("Database connection successful")
        
        # List existing tenants
        tenants = await list_all_tenants()
        
        # Create default tenant if needed
        if not any(str(tenant.id) == str(STATIC_TENANT_ID) for tenant in tenants):
            await create_default_tenant()
        
        # List tenants again to verify
        await list_all_tenants()
        
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())