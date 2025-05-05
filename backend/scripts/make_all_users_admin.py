#!/usr/bin/env python
"""
Script to set all users as admin users in the database.
"""
import asyncio
import logging
import os
import sys

# Add the parent directory to sys.path to make app imports work
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import SessionLocal
from app.models.user import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def make_all_users_admin():
    """Set all users to have is_admin=True"""
    logger.info("Starting to make all users admin...")
    
    async with SessionLocal() as db:
        # Get all users
        stmt = select(User)
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        logger.info(f"Found {len(users)} users in the database")
        
        admin_count = 0
        for user in users:
            # Skip users who are already admin
            if user.is_admin:
                logger.info(f"User {user.email} is already an admin")
                continue
                
            # Set user as admin
            user.is_admin = True
            admin_count += 1
            logger.info(f"Made {user.email} an admin")
        
        if admin_count > 0:
            # Commit changes
            await db.commit()
            logger.info(f"Successfully updated {admin_count} users to admin status")
        else:
            logger.info("No users needed updating to admin status")
    
    logger.info("All users have been made admins")

if __name__ == "__main__":
    asyncio.run(make_all_users_admin())