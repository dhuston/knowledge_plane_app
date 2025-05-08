#!/usr/bin/env python3
"""
Script to list all tables in the database
"""

import os
import sys
import asyncio

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

import asyncpg

async def list_tables():
    """List all tables in the database"""
    try:
        # Get database URL from environment or use default
        database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@db/knowledgeplan_dev")
        
        # Connect to the database
        conn = await asyncpg.connect(database_url)
        
        # Query all tables in the public schema
        tables_query = """
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
        """
        tables = [row['tablename'] for row in await conn.fetch(tables_query)]
        
        print("Tables in the database:")
        for table in tables:
            print(f"- {table}")
        
        # Close the connection
        await conn.close()
        
    except Exception as e:
        print(f"Error listing tables: {str(e)}")

if __name__ == "__main__":
    asyncio.run(list_tables())