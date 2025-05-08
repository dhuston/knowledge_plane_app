#!/usr/bin/env python3
"""
Script to check alembic migration status
"""

import os
import sys
import asyncio

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

import asyncpg

async def check_alembic():
    """Check alembic migration status"""
    try:
        # Get database URL from environment or use default
        database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@db/knowledgeplan_dev")
        
        # Connect to the database
        conn = await asyncpg.connect(database_url)
        
        # Check if alembic_version table exists
        alembic_check = await conn.fetchval("""
        SELECT EXISTS (
            SELECT FROM pg_tables
            WHERE schemaname = 'public' 
            AND tablename = 'alembic_version'
        )
        """)
        
        if alembic_check:
            print("alembic_version table exists")
            
            # Get the current version
            version = await conn.fetchval("SELECT version_num FROM alembic_version")
            print(f"Current migration version: {version}")
        else:
            print("alembic_version table does not exist")
        
        # Close the connection
        await conn.close()
        
    except Exception as e:
        print(f"Error checking alembic: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_alembic())