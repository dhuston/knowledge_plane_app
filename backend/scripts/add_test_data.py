"""
Script to add test data to the graph database for map visualization.
"""
import asyncio
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db_session
from app.models.node import Node
from app.models.edge import Edge


async def create_test_data():
    """
    Create test data for the map visualization.
    Adds nodes and edges for a simple organizational structure.
    """
    print("Creating test data for map visualization...")
    
    # Use UUID for demo tenant
    tenant_id = UUID('00000000-0000-0000-0000-000000000001')
    
    async for session in get_db_session():
        # Check if we already have data for this tenant
        result = await session.execute(
            select(Node).where(Node.tenant_id == tenant_id).limit(1)
        )
        if result.scalar_one_or_none() is not None:
            print(f"Data already exists for tenant {tenant_id}")
            return
        
        # Create test nodes
        nodes = []
        
        # Create a team
        team_node = Node(
            tenant_id=tenant_id,
            type="team",
            props={
                "name": "Data Science Team", 
                "description": "Team responsible for data analysis and ML",
                "entity_id": "team-1"
            },
            x=0.0,
            y=0.0
        )
        nodes.append(team_node)
        
        # Create users
        user_positions = [
            (-1.5, -1.5),  # Top left
            (1.5, -1.5),   # Top right
            (-1.5, 1.5),   # Bottom left
            (1.5, 1.5),    # Bottom right
        ]
        
        user_nodes = []
        for i, pos in enumerate(user_positions, 1):
            user_node = Node(
                tenant_id=tenant_id,
                type="user",
                props={
                    "name": f"User {i}", 
                    "title": f"Data Scientist {i}",
                    "email": f"user{i}@example.com",
                    "entity_id": f"user-{i}"
                },
                x=pos[0],
                y=pos[1]
            )
            user_nodes.append(user_node)
            nodes.append(user_node)
        
        # Create projects
        project_node1 = Node(
            tenant_id=tenant_id,
            type="project",
            props={
                "name": "ML Model Deployment", 
                "description": "Deploy ML models to production",
                "status": "active",
                "entity_id": "project-1"
            },
            x=-3.0,
            y=0.0
        )
        nodes.append(project_node1)
        
        project_node2 = Node(
            tenant_id=tenant_id,
            type="project",
            props={
                "name": "Data Pipeline Optimization", 
                "description": "Optimize data pipelines for better performance",
                "status": "active",
                "entity_id": "project-2"
            },
            x=3.0,
            y=0.0
        )
        nodes.append(project_node2)
        
        # Create a goal
        goal_node = Node(
            tenant_id=tenant_id,
            type="goal",
            props={
                "name": "Improve Model Accuracy", 
                "description": "Achieve 95% accuracy on all models",
                "status": "in_progress",
                "progress": 75,
                "entity_id": "goal-1"
            },
            x=0.0,
            y=3.0
        )
        nodes.append(goal_node)
        
        # Add all nodes to the session
        session.add_all(nodes)
        await session.flush()
        
        # Create edges
        edges = []
        
        # Team to user edges
        for user_node in user_nodes:
            edge = Edge(
                tenant_id=tenant_id,
                src=team_node.id,
                dst=user_node.id,
                label="HAS_MEMBER",
                weight=1.0
            )
            edges.append(edge)
        
        # User to project edges - first 2 users on project 1, last 2 on project 2
        for i, user_node in enumerate(user_nodes):
            project_node = project_node1 if i < 2 else project_node2
            edge = Edge(
                tenant_id=tenant_id,
                src=user_node.id,
                dst=project_node.id,
                label="PARTICIPATES_IN",
                weight=1.0
            )
            edges.append(edge)
        
        # Project to goal edges
        for project_node in [project_node1, project_node2]:
            edge = Edge(
                tenant_id=tenant_id,
                src=project_node.id,
                dst=goal_node.id,
                label="ALIGNED_TO",
                weight=1.0
            )
            edges.append(edge)
        
        # Add all edges to the session
        session.add_all(edges)
        
        # Commit all changes
        await session.commit()
        
        print(f"Created {len(nodes)} nodes and {len(edges)} edges for tenant {tenant_id}")


if __name__ == "__main__":
    asyncio.run(create_test_data())