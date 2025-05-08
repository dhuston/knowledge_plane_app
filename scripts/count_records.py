#!/usr/bin/env python3
"""
Script to count records in the database for each table
"""

import os
import sys
import asyncio

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

import asyncpg

async def count_records():
    """Count records in each table"""
    try:
        # Get database URL from environment or use default
        database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@db/knowledgeplan_dev")
        
        # Connect to the database
        conn = await asyncpg.connect(database_url)
        
        # Define tables to check
        tables = [
            "tenants",
            "departments", 
            "teams", 
            "users", 
            "goals", 
            "projects", 
            "knowledge_assets", 
            "nodes", 
            "edges", 
            "project_participants"
        ]
        
        # Count records for each table for our tenant ID
        tenant_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        
        print("Table counts for tenant ID:", tenant_id)
        print("-------------------------------")
        
        for table in tables:
            # Skip tenants table as it doesn't have tenant_id column
            if table == "tenants":
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
                # Check if our tenant exists
                has_tenant = await conn.fetchval(f"SELECT COUNT(*) FROM {table} WHERE id = '{tenant_id}'")
                print(f"{table}: {count} (Our tenant exists: {'Yes' if has_tenant else 'No'})")
            else:
                count = await conn.fetchval(f"SELECT COUNT(*) FROM {table} WHERE tenant_id = '{tenant_id}'")
                print(f"{table}: {count}")
        
        # Close the connection
        await conn.close()
        
    except Exception as e:
        print(f"Error counting records: {str(e)}")

if __name__ == "__main__":
    asyncio.run(count_records())