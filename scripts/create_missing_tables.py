#!/usr/bin/env python3
"""
Script to create missing tables directly using SQL
"""

import os
import sys
import asyncio

# Add the parent directory to sys.path to import app modules
sys.path.append('/app')

import asyncpg

# SQL statements to create tables
CREATE_NODES_TABLE = """
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL,
    props JSONB,
    x FLOAT,
    y FLOAT
);
CREATE INDEX IF NOT EXISTS ix_nodes_type ON nodes (type);
CREATE INDEX IF NOT EXISTS ix_nodes_tenant_id ON nodes (tenant_id);
CREATE INDEX IF NOT EXISTS ix_nodes_xy ON nodes (x, y);
"""

CREATE_EDGES_TABLE = """
CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    src UUID NOT NULL,
    dst UUID NOT NULL,
    label VARCHAR NOT NULL,
    props JSONB
);
CREATE INDEX IF NOT EXISTS ix_edges_src ON edges (tenant_id, src);
CREATE INDEX IF NOT EXISTS ix_edges_dst ON edges (tenant_id, dst);
CREATE INDEX IF NOT EXISTS ix_edges_label ON edges (tenant_id, label);
"""

CREATE_PROJECTS_TABLE = """
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    owning_team_id UUID REFERENCES teams(id),
    goal_id UUID,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_projects_tenant_id ON projects (tenant_id);
CREATE INDEX IF NOT EXISTS ix_projects_name ON projects (name);
CREATE INDEX IF NOT EXISTS ix_projects_owning_team_id ON projects (owning_team_id);
"""

CREATE_GOALS_TABLE = """
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES goals(id),
    status VARCHAR(50) DEFAULT 'on_track',
    progress INTEGER DEFAULT 0,
    due_date DATE,
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_goals_tenant_id ON goals (tenant_id);
CREATE INDEX IF NOT EXISTS ix_goals_title ON goals (title);
CREATE INDEX IF NOT EXISTS ix_goals_type ON goals (type);
CREATE INDEX IF NOT EXISTS ix_goals_parent_id ON goals (parent_id);
"""

ADD_GOAL_FK = """
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_goal_id_goals
FOREIGN KEY (goal_id) REFERENCES goals(id);
"""

CREATE_KNOWLEDGE_ASSETS_TABLE = """
CREATE TABLE IF NOT EXISTS knowledge_assets (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(255),
    type VARCHAR(50) NOT NULL,
    source VARCHAR(100),
    link TEXT,
    content TEXT,
    project_id UUID REFERENCES projects(id),
    created_by_user_id UUID REFERENCES users(id),
    properties JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS ix_knowledge_assets_tenant_id ON knowledge_assets (tenant_id);
CREATE INDEX IF NOT EXISTS ix_knowledge_assets_title ON knowledge_assets (title);
CREATE INDEX IF NOT EXISTS ix_knowledge_assets_type ON knowledge_assets (type);
CREATE INDEX IF NOT EXISTS ix_knowledge_assets_project_id ON knowledge_assets (project_id);
CREATE INDEX IF NOT EXISTS ix_knowledge_assets_created_by_user_id ON knowledge_assets (created_by_user_id);
"""

CREATE_PROJECT_PARTICIPANTS_TABLE = """
CREATE TABLE IF NOT EXISTS project_participants (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, user_id)
);
"""

async def create_tables():
    """Create missing tables directly using SQL"""
    try:
        # Get database URL from environment or use default
        database_url = os.environ.get("DATABASE_URL", "postgresql://postgres:password@db/knowledgeplan_dev")
        
        # Connect to the database
        conn = await asyncpg.connect(database_url)
        
        print("Creating necessary tables...")
        
        # Create tables in the right order to respect foreign keys
        print("Creating nodes table...")
        await conn.execute(CREATE_NODES_TABLE)
        
        print("Creating edges table...")
        await conn.execute(CREATE_EDGES_TABLE)
        
        print("Creating goals table...")
        await conn.execute(CREATE_GOALS_TABLE)
        
        print("Creating projects table...")
        await conn.execute(CREATE_PROJECTS_TABLE)
        
        print("Adding goal foreign key to projects table...")
        try:
            await conn.execute(ADD_GOAL_FK)
            print("Added goal foreign key successfully")
        except Exception as e:
            print(f"Couldn't add goal foreign key, it may already exist: {str(e)}")
        
        print("Creating knowledge_assets table...")
        await conn.execute(CREATE_KNOWLEDGE_ASSETS_TABLE)
        
        print("Creating project_participants table...")
        await conn.execute(CREATE_PROJECT_PARTICIPANTS_TABLE)
        
        # Verify the tables were created
        tables = await conn.fetch("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
            ORDER BY tablename
        """)
        
        print("\nTables in the database after creation:")
        for row in tables:
            print(f"- {row['tablename']}")
        
        # Close the connection
        await conn.close()
        
    except Exception as e:
        print(f"Error creating tables: {str(e)}")

if __name__ == "__main__":
    asyncio.run(create_tables())