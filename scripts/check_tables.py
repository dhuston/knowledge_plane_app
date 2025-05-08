#!/usr/bin/env python3
"""
Script to check if all required tables exist in the database
"""

import os
import sys
import asyncio

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

import asyncpg

async def check_tables():
    """Check if all required tables exist in the database async version"""
    try:
        # Get database URL from environment or use default
        database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@db/knowledgeplan_dev")
        
        # Connect to the database
        conn = await asyncpg.connect(database_url)
        
        # Query all tables in the public schema
        tables_query = """
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        """
        tables = [row['tablename'] for row in await conn.fetch(tables_query)]
        
        # Define expected tables
        expected_tables = [
            'tenants', 'users', 'teams', 'departments', 
            'projects', 'goals', 'knowledge_assets',
            'nodes', 'edges', 'project_participants'
        ]
        
        # Check if all expected tables exist
        missing_tables = []
        for table in expected_tables:
            if table not in tables:
                missing_tables.append(table)
        
        if missing_tables:
            print(f"Missing tables: {missing_tables}")
        else:
            print("All required tables exist")
            for table in expected_tables:
                # Count rows in each table
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                print(f"Table '{table}' has {count} rows")
        
        # Close the connection
        await conn.close()
        
    except Exception as e:
        print(f"Error checking tables: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_tables())