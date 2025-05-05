"""
Script to create a development user with specific ID

This script creates a development user with ID 11111111-1111-1111-1111-111111111111
which matches the ID used in the demo/quick login feature.
"""

import sys
import os
import asyncio
import logging
from uuid import UUID
from datetime import datetime, timezone

# Add parent directory to path for importing app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy import select, insert
from app.db.session import SessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from app.models.team import Team

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Development user constants
DEV_USER_ID = UUID("11111111-1111-1111-1111-111111111111")
# Use the Pharma tenant ID that the frontend is using
PHARMA_TENANT_ID = UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
DEV_TENANT_ID = PHARMA_TENANT_ID  # Use the Pharma tenant ID to fix the mismatch
DEV_TEAM_ID = UUID("839b5261-9228-4955-bcb5-f52452f0cf2e")

async def ensure_tenant_exists(session) -> UUID:
    """Ensure development tenant exists, create if not."""
    logger.info(f"Checking if tenant with ID {DEV_TENANT_ID} exists")
    
    # First check for the Pharma tenant ID specifically
    stmt = select(Tenant).where(Tenant.id == PHARMA_TENANT_ID)
    result = await session.execute(stmt)
    pharma_tenant = result.scalar_one_or_none()
    
    if pharma_tenant:
        logger.info(f"Found Pharma tenant: {pharma_tenant.name} ({pharma_tenant.id})")
        return pharma_tenant.id
    
    # Fall back to checking for the dev tenant
    stmt = select(Tenant).where(Tenant.id == DEV_TENANT_ID)
    result = await session.execute(stmt)
    tenant = result.scalar_one_or_none()
    
    if tenant:
        logger.info(f"Development tenant already exists: {tenant.name} ({tenant.id})")
        return tenant.id
        
    # Create tenant if not exists
    tenant = Tenant(
        id=DEV_TENANT_ID,
        name="Development Tenant",
        domain="dev.biosphere.ai",
        is_active=True,
        created_at=datetime.now(),  # Use naive datetime to match database expectations
        updated_at=datetime.now(),
        settings={}
    )
    session.add(tenant)
    await session.commit()
    logger.info(f"Created development tenant: {tenant.name} ({tenant.id})")
    
    return tenant.id

async def ensure_team_exists(session) -> UUID:
    """Ensure development team exists, create if not."""
    # Check if team exists
    stmt = select(Team).where(Team.id == DEV_TEAM_ID)
    result = await session.execute(stmt)
    team = result.scalar_one_or_none()
    
    if team:
        logger.info(f"Development team already exists: {team.name} ({team.id})")
        return team.id
        
    # Create team if not exists
    team = Team(
        id=DEV_TEAM_ID,
        name="Development Team",
        description="Team for development users",
        tenant_id=DEV_TENANT_ID,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    session.add(team)
    await session.commit()
    logger.info(f"Created development team: {team.name} ({team.id})")
    
    return team.id

async def ensure_dev_user_exists(session) -> UUID:
    """Ensure development user exists, create if not."""
    # First check for existing user with email dan@example.com
    stmt = select(User).where(User.email == "dan@example.com")
    result = await session.execute(stmt)
    existing_email_user = result.scalar_one_or_none()
    
    if existing_email_user and existing_email_user.id != DEV_USER_ID:
        logger.info(f"Found existing user with email dan@example.com, ID: {existing_email_user.id}")
        logger.info(f"Will use a different email for dev user to avoid collision")
        use_email = "dev.dan@example.com"  # Use alternative email
    else:
        use_email = "dan@example.com"
    
    # Check if development user exists by ID
    stmt = select(User).where(User.id == DEV_USER_ID)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user:
        logger.info(f"Development user already exists: {user.email} ({user.id})")
        logger.info(f"Current tenant ID: {user.tenant_id} (should be {DEV_TENANT_ID})")
        
        # Update user fields to ensure they match what we need
        user.email = use_email
        user.name = "Dan"
        user.title = "Software Developer"
        user.tenant_id = DEV_TENANT_ID  # Use the Pharma tenant ID
        user.team_id = DEV_TEAM_ID
        user.auth_provider = "mock"
        user.auth_provider_id = "mock_id"
        user.online_status = True
        user.updated_at = datetime.now()
        user.last_login_at = datetime.now()
        
        await session.commit()
        logger.info(f"Updated development user: {user.name} ({user.id}) with email {user.email}")
        logger.info(f"Now with tenant ID: {user.tenant_id}")
        return user.id
        
    # Create user if not exists
    logger.info(f"Creating new development user with ID {DEV_USER_ID} and tenant ID {DEV_TENANT_ID}")
    
    user = User(
        id=DEV_USER_ID,
        email=use_email,  # Use the email that won't cause conflicts
        name="Dan",
        title="Software Developer",
        avatar_url=None,
        online_status=True,
        tenant_id=DEV_TENANT_ID,  # Use the Pharma tenant ID
        team_id=DEV_TEAM_ID,
        auth_provider="mock",
        auth_provider_id="mock_id",
        created_at=datetime.now(),
        updated_at=datetime.now(),
        last_login_at=datetime.now()
    )
    session.add(user)
    await session.commit()
    logger.info(f"Created development user: {user.email} ({user.id}) with tenant ID {user.tenant_id}")
    
    # Double-check the user tenant from database
    stmt = select(User).where(User.id == DEV_USER_ID) 
    result = await session.execute(stmt)
    saved_user = result.scalar_one()
    logger.info(f"Verified user in database: tenant ID = {saved_user.tenant_id}")
    
    return user.id

async def main():
    """Main function to create development entities."""
    logger.info("Starting development user creation script")
    
    # Create a session using the SessionLocal factory
    session = SessionLocal()
    try:
        # Ensure tenant exists
        tenant_id = await ensure_tenant_exists(session)
        # Ensure team exists
        team_id = await ensure_team_exists(session)
        # Ensure dev user exists
        user_id = await ensure_dev_user_exists(session)
        
        logger.info(f"Development entities setup complete. User ID: {user_id}, Tenant ID: {tenant_id}, Team ID: {team_id}")
    except Exception as e:
        logger.error(f"Error creating development entities: {e}")
        await session.rollback()
        raise
    finally:
        await session.close()

if __name__ == "__main__":
    asyncio.run(main())