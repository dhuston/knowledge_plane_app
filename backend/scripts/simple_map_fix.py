#!/usr/bin/env python3
"""
simple_map_fix.py - Direct SQL fix for Living Map graph data

This script creates nodes and edges directly using raw SQL commands for faster execution
and fewer dependencies. It's designed to be run once to populate the graph data.

Usage:
  python simple_map_fix.py

Notes:
  This script uses direct SQL, so it doesn't require SQLAlchemy or asyncpg.
"""

import os
import sys
import random
import psycopg2
import uuid
from datetime import datetime
import json

# Database connection settings - adjust as needed
DB_HOST = "localhost" 
DB_PORT = "5433"
DB_NAME = "knowledgeplan_dev"
DB_USER = "postgres"
DB_PASSWORD = "password"

def get_connection():
    """Get a database connection."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        print(f"Connected to database {DB_NAME} on {DB_HOST}:{DB_PORT}")
        
        # Check what tables actually exist
        with conn.cursor() as cur:
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """)
            tables = [row[0] for row in cur.fetchall()]
            print("\nAvailable tables:")
            for table in tables:
                print(f"  - {table}")
        
        # Look for likely candidates for node/edge tables
        graph_tables = [t for t in tables if 'node' in t.lower() or 'edge' in t.lower() or 'graph' in t.lower()]
        if graph_tables:
            print("\nPossible graph tables found:", graph_tables)
        
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        sys.exit(1)

def get_tenants(conn):
    """Get all tenants in the database."""
    print("Fetching tenants...")
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM tenants")
        return cur.fetchall()

def table_exists(conn, table_name):
    """Check if a table exists in the database."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = %s
            )
        """, (table_name,))
        return cur.fetchone()[0]

def get_entities(conn, tenant_id, entity_type):
    """Get all entities of a type for a tenant."""
    table_name = f"{entity_type}s"
    
    # Check if table exists
    if not table_exists(conn, table_name):
        print(f"WARNING: Table '{table_name}' does not exist - skipping")
        return []
    
    # For users table, some might have NULL name but have email
    if entity_type == "user":
        with conn.cursor() as cur:
            cur.execute(f"SELECT id, COALESCE(name, email) FROM {table_name} WHERE tenant_id = %s", (tenant_id,))
            return cur.fetchall()
    else:
        # For other tables, get by name
        try:
            with conn.cursor() as cur:
                cur.execute(f"SELECT id, name FROM {table_name} WHERE tenant_id = %s", (tenant_id,))
                return cur.fetchall()
        except psycopg2.Error as e:
            # If name column doesn't exist, try title (for goals)
            if entity_type == "goal":
                try:
                    with conn.cursor() as cur:
                        cur.execute(f"SELECT id, title FROM {table_name} WHERE tenant_id = %s", (tenant_id,))
                        return cur.fetchall()
                except psycopg2.Error:
                    print(f"ERROR: Could not find name or title column for {table_name}")
                    return []
            else:
                print(f"ERROR: Failed to get entities from {table_name}: {e}")
                return []

def create_node(conn, tenant_id, node_type, entity_id, name, x=None, y=None):
    """Create a node for an entity."""
    node_id = str(uuid.uuid4())
    props = json.dumps({"entity_id": str(entity_id), "name": name})
    
    # Generate random coordinates if not provided
    if x is None:
        x = random.uniform(-100, 100)
    if y is None:
        y = random.uniform(-100, 100)
    
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO nodes (id, tenant_id, type, props, x, y) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (node_id, tenant_id, node_type, props, x, y)
        )
        return cur.fetchone()[0]

def create_edge(conn, tenant_id, src_id, dst_id, label):
    """Create an edge between nodes."""
    edge_id = str(uuid.uuid4())
    props = json.dumps({})
    
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO edges (id, tenant_id, src, dst, label, props) VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
            (edge_id, tenant_id, src_id, dst_id, label, props)
        )
        return cur.fetchone()[0]

def check_node_exists(conn, tenant_id, entity_type, entity_id):
    """Check if a node already exists for an entity."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id FROM nodes 
            WHERE tenant_id = %s 
            AND type = %s 
            AND props->>'entity_id' = %s
            """, 
            (tenant_id, entity_type, str(entity_id))
        )
        result = cur.fetchone()
        return result[0] if result else None

def get_node_counts_by_tenant(conn):
    """Get node counts by tenant to verify results."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT t.name, n.type, COUNT(*)
            FROM nodes n
            JOIN tenants t ON n.tenant_id = t.id
            GROUP BY t.name, n.type
            ORDER BY t.name, n.type
        """)
        return cur.fetchall()

def get_entity_relationships(conn, tenant_id):
    """Get relationships between entities to create edges."""
    relationships = []
    
    # Check which tables exist before querying relationships
    tables = ["users", "teams", "projects", "goals", "departments"]
    existing_tables = []
    for table in tables:
        if table_exists(conn, table):
            existing_tables.append(table)
    
    print(f"Found existing tables for relationships: {existing_tables}")
    
    # User -> Team relationships (team membership)
    if "users" in existing_tables and "teams" in existing_tables:
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT u.id, u.team_id FROM users u WHERE u.tenant_id = %s AND u.team_id IS NOT NULL",
                    (tenant_id,)
                )
                for user_id, team_id in cur.fetchall():
                    relationships.append(('user', user_id, 'team', team_id, 'MEMBER_OF'))
        except psycopg2.Error as e:
            print(f"Error getting user->team relationships: {e}")
    
    # User -> User relationships (manager)
    if "users" in existing_tables:
        # Check if manager_id column exists
        try:
            with conn.cursor() as cur:
                # First check if manager_id column exists
                cur.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'users' AND column_name = 'manager_id'
                    )
                """)
                if cur.fetchone()[0]:
                    cur.execute(
                        "SELECT u.id, u.manager_id FROM users u WHERE u.tenant_id = %s AND u.manager_id IS NOT NULL",
                        (tenant_id,)
                    )
                    for user_id, manager_id in cur.fetchall():
                        relationships.append(('user', user_id, 'user', manager_id, 'REPORTS_TO'))
                else:
                    print("Users table doesn't have manager_id column")
        except psycopg2.Error as e:
            print(f"Error getting user->manager relationships: {e}")
    
    # Team -> User relationships (team lead)
    if "teams" in existing_tables and "users" in existing_tables:
        # Check if lead_id column exists
        try:
            with conn.cursor() as cur:
                # First check if lead_id column exists
                cur.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'teams' AND column_name = 'lead_id'
                    )
                """)
                if cur.fetchone()[0]:
                    cur.execute(
                        "SELECT t.id, t.lead_id FROM teams t WHERE t.tenant_id = %s AND t.lead_id IS NOT NULL",
                        (tenant_id,)
                    )
                    for team_id, lead_id in cur.fetchall():
                        relationships.append(('team', team_id, 'user', lead_id, 'LEADS'))
                else:
                    print("Teams table doesn't have lead_id column")
        except psycopg2.Error as e:
            print(f"Error getting team->lead relationships: {e}")
    
    # Only add project relationships if projects table exists
    if "projects" in existing_tables:
        # Project -> Team relationships (owning team)
        if "teams" in existing_tables:
            try:
                with conn.cursor() as cur:
                    # Check if owning_team_id column exists
                    cur.execute("""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'projects' AND column_name = 'owning_team_id'
                        )
                    """)
                    if cur.fetchone()[0]:
                        cur.execute(
                            "SELECT p.id, p.owning_team_id FROM projects p WHERE p.tenant_id = %s AND p.owning_team_id IS NOT NULL",
                            (tenant_id,)
                        )
                        for project_id, team_id in cur.fetchall():
                            relationships.append(('team', team_id, 'project', project_id, 'OWNS'))
                    else:
                        print("Projects table doesn't have owning_team_id column")
            except psycopg2.Error as e:
                print(f"Error getting project->team relationships: {e}")
        
        # Project -> Goal relationships
        if "goals" in existing_tables:
            try:
                with conn.cursor() as cur:
                    # Check if goal_id column exists
                    cur.execute("""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'projects' AND column_name = 'goal_id'
                        )
                    """)
                    if cur.fetchone()[0]:
                        cur.execute(
                            "SELECT p.id, p.goal_id FROM projects p WHERE p.tenant_id = %s AND p.goal_id IS NOT NULL",
                            (tenant_id,)
                        )
                        for project_id, goal_id in cur.fetchall():
                            relationships.append(('project', project_id, 'goal', goal_id, 'ALIGNED_TO'))
                    else:
                        print("Projects table doesn't have goal_id column")
            except psycopg2.Error as e:
                print(f"Error getting project->goal relationships: {e}")
    
    # Goal -> Goal relationships (parent/child)
    if "goals" in existing_tables:
        try:
            with conn.cursor() as cur:
                # Check if parent_id column exists
                cur.execute("""
                    SELECT EXISTS (
                        SELECT 1 FROM information_schema.columns 
                        WHERE table_name = 'goals' AND column_name = 'parent_id'
                    )
                """)
                if cur.fetchone()[0]:
                    cur.execute(
                        "SELECT g.id, g.parent_id FROM goals g WHERE g.tenant_id = %s AND g.parent_id IS NOT NULL",
                        (tenant_id,)
                    )
                    for goal_id, parent_id in cur.fetchall():
                        relationships.append(('goal', goal_id, 'goal', parent_id, 'PARENT_OF'))
                else:
                    print("Goals table doesn't have parent_id column")
        except psycopg2.Error as e:
            print(f"Error getting goal->goal relationships: {e}")
    
    # Count relationships by type
    relationship_counts = {}
    for _, _, _, _, rel_type in relationships:
        relationship_counts[rel_type] = relationship_counts.get(rel_type, 0) + 1
    
    if relationship_counts:
        print("Relationship counts by type:")
        for rel_type, count in relationship_counts.items():
            print(f"  - {rel_type}: {count}")
    else:
        print("No relationships found")
    
    return relationships

def process_tenant(conn, tenant_id, tenant_name):
    """Process all entities for a tenant."""
    print(f"\nProcessing tenant: {tenant_name} ({tenant_id})")
    
    # Dictionary to store node IDs by entity type and ID
    node_map = {}
    
    # Skip default graph creation - let the tenant start with an empty map
    if not table_exists(conn, "teams") and not table_exists(conn, "projects") and not table_exists(conn, "goals"):
        print("No entity tables found. Skipping default graph creation.")
        return 0, 0
    
    # Process teams
    print("Processing teams...")
    team_count = 0
    for team_id, team_name in get_entities(conn, tenant_id, "team"):
        node_id = check_node_exists(conn, tenant_id, "team", team_id)
        if not node_id:
            node_id = create_node(conn, tenant_id, "team", team_id, team_name)
            team_count += 1
        node_map[('team', team_id)] = node_id
    print(f"Created {team_count} team nodes")
    
    # Process users
    print("Processing users...")
    user_count = 0
    for user_id, user_name in get_entities(conn, tenant_id, "user"):
        node_id = check_node_exists(conn, tenant_id, "user", user_id)
        if not node_id:
            node_id = create_node(conn, tenant_id, "user", user_id, user_name or f"User {user_id}")
            user_count += 1
        node_map[('user', user_id)] = node_id
    print(f"Created {user_count} user nodes")
    
    # Process projects
    print("Processing projects...")
    project_count = 0
    for project_id, project_name in get_entities(conn, tenant_id, "project"):
        node_id = check_node_exists(conn, tenant_id, "project", project_id)
        if not node_id:
            node_id = create_node(conn, tenant_id, "project", project_id, project_name)
            project_count += 1
        node_map[('project', project_id)] = node_id
    print(f"Created {project_count} project nodes")
    
    # Process goals
    print("Processing goals...")
    goal_count = 0
    for goal_id, goal_name in get_entities(conn, tenant_id, "goal"):
        node_id = check_node_exists(conn, tenant_id, "goal", goal_id)
        if not node_id:
            node_id = create_node(conn, tenant_id, "goal", goal_id, goal_name)
            goal_count += 1
        node_map[('goal', goal_id)] = node_id
    print(f"Created {goal_count} goal nodes")
    
    # Create edges
    print("Creating edges...")
    edge_count = 0
    relationships = get_entity_relationships(conn, tenant_id)
    for src_type, src_id, dst_type, dst_id, label in relationships:
        if (src_type, src_id) in node_map and (dst_type, dst_id) in node_map:
            src_node_id = node_map[(src_type, src_id)]
            dst_node_id = node_map[(dst_type, dst_id)]
            
            # Check if edge already exists
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT COUNT(*) FROM edges
                    WHERE tenant_id = %s AND src = %s AND dst = %s AND label = %s
                    """,
                    (tenant_id, src_node_id, dst_node_id, label)
                )
                if cur.fetchone()[0] == 0:
                    create_edge(conn, tenant_id, src_node_id, dst_node_id, label)
                    edge_count += 1
    
    print(f"Created {edge_count} edges")
    conn.commit()
    
    return team_count + user_count + project_count + goal_count, edge_count

def create_tables_if_needed(conn):
    """Create the nodes and edges tables if they don't exist."""
    print("\nChecking if graph tables need to be created...")
    with conn.cursor() as cur:
        # Check if nodes table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'nodes'
            )
        """)
        nodes_exist = cur.fetchone()[0]
        
        # Check if edges table exists
        cur.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'edges'
            )
        """)
        edges_exist = cur.fetchone()[0]
        
        # Create tables if needed
        if not nodes_exist:
            print("Creating nodes table...")
            cur.execute("""
                CREATE TABLE nodes (
                    id UUID PRIMARY KEY,
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    type VARCHAR NOT NULL,
                    props JSONB NOT NULL DEFAULT '{}',
                    x FLOAT,
                    y FLOAT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Add indices
            cur.execute("CREATE INDEX idx_nodes_tenant_id ON nodes (tenant_id)")
            cur.execute("CREATE INDEX idx_nodes_type ON nodes (type)")
            cur.execute("CREATE INDEX idx_nodes_xy ON nodes (x, y)")
            print("Created nodes table with indices")
        
        if not edges_exist:
            print("Creating edges table...")
            cur.execute("""
                CREATE TABLE edges (
                    id UUID PRIMARY KEY,
                    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                    src UUID NOT NULL,
                    dst UUID NOT NULL,
                    label VARCHAR NOT NULL,
                    props JSONB NOT NULL DEFAULT '{}',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Add indices
            cur.execute("CREATE INDEX idx_edges_tenant_id ON edges (tenant_id)")
            cur.execute("CREATE INDEX idx_edges_src ON edges (src)")
            cur.execute("CREATE INDEX idx_edges_dst ON edges (dst)")
            cur.execute("CREATE INDEX idx_edges_label ON edges (label)")
            print("Created edges table with indices")

        # Commit the transaction to persist table creation
        conn.commit()
        
        if not nodes_exist or not edges_exist:
            print("Created new graph database tables")
        else:
            print("Graph tables already exist")

def main():
    """Main entry point."""
    print("Starting Living Map data synchronization")
    
    conn = get_connection()
    try:
        # Create tables if they don't exist
        create_tables_if_needed(conn)
        
        # Get initial node/edge counts
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM nodes")
            initial_nodes = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM edges")
            initial_edges = cur.fetchone()[0]
        
        print(f"Initial counts: {initial_nodes} nodes, {initial_edges} edges")
        
        # Process all tenants
        tenants = get_tenants(conn)
        print(f"Found {len(tenants)} tenants")
        
        total_nodes = 0
        total_edges = 0
        
        for tenant_id, tenant_name in tenants:
            nodes, edges = process_tenant(conn, tenant_id, tenant_name)
            total_nodes += nodes
            total_edges += edges
        
        # Get final counts
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM nodes")
            final_nodes = cur.fetchone()[0]
            cur.execute("SELECT COUNT(*) FROM edges")
            final_edges = cur.fetchone()[0]
        
        print("\nFinal results:")
        print(f"Created {total_nodes} nodes and {total_edges} edges")
        print(f"Total in database: {final_nodes} nodes, {final_edges} edges")
        
        # Show counts by tenant
        print("\nNode counts by tenant and type:")
        counts = get_node_counts_by_tenant(conn)
        for tenant, node_type, count in counts:
            print(f"  {tenant}: {count} {node_type} nodes")
        
    finally:
        conn.close()
    
    print("\nDone! The Living Map data should now be synchronized with entities.")
    print("Each tenant should see their own data in the map visualization.")

if __name__ == "__main__":
    main()