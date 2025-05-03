"""
Tests for the Node CRUD operations with spatial features.
"""
import pytest
from uuid import uuid4, UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker

from geoalchemy2.functions import ST_DWithin, ST_SetSRID, ST_MakePoint
from app.crud.crud_node import CRUDNode, node
from app.models.node import Node


# Test database setup
TEST_SQLALCHEMY_DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5433/test_db"

engine = create_async_engine(TEST_SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)


@pytest.fixture
async def db_session():
    """Fixture that returns a SQLAlchemy session with a rollback point"""
    async with TestingSessionLocal() as session:
        yield session
        # Rollback the session
        await session.rollback()


@pytest.fixture
async def tenant_id():
    """Return a fixed tenant ID for testing"""
    return UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
async def setup_spatial_nodes(db_session, tenant_id):
    """Set up test nodes with spatial coordinates"""
    # Create center node
    center_node = await node.create(
        db=db_session,
        tenant_id=tenant_id,
        node_type="test_center",
        props={"name": "Center Node"},
        x=0,
        y=0
    )
    
    # Create nodes at various distances from center
    nodes = [center_node]
    
    # Create nodes in a grid pattern
    grid_size = 5
    for i in range(-grid_size, grid_size + 1):
        for j in range(-grid_size, grid_size + 1):
            if i == 0 and j == 0:
                continue  # Skip center node (already created)
                
            distance_from_center = max(abs(i), abs(j))
            node_type = f"test_distance_{distance_from_center}"
            
            test_node = await node.create(
                db=db_session,
                tenant_id=tenant_id,
                node_type=node_type,
                props={"name": f"Node {i},{j}", "x_coord": i, "y_coord": j},
                x=i * 100,
                y=j * 100
            )
            nodes.append(test_node)
    
    await db_session.commit()
    
    yield {
        "center_node": center_node,
        "all_nodes": nodes
    }
    
    # Clean up nodes after the test
    for n in nodes:
        await db_session.delete(n)
    await db_session.commit()


@pytest.mark.asyncio
async def test_create_node_with_coordinates(db_session, tenant_id):
    """Test creating a node with spatial coordinates"""
    # Create a node with coordinates
    test_node = await node.create(
        db=db_session,
        tenant_id=tenant_id,
        node_type="test_spatial",
        props={"name": "Test Node"},
        x=123.45,
        y=678.90
    )
    
    # Verify that coordinates were saved
    assert test_node.x == 123.45
    assert test_node.y == 678.90
    
    # Verify that position geometry was created by the database trigger
    db_node = await node.get(db=db_session, id=test_node.id)
    assert db_node.position is not None
    
    # Clean up the test node
    await db_session.delete(test_node)
    await db_session.commit()


@pytest.mark.asyncio
async def test_get_nodes_in_radius(db_session, tenant_id, setup_spatial_nodes):
    """Test getting nodes within a specified radius"""
    center_node = setup_spatial_nodes["center_node"]
    
    # Test with small radius (should return few nodes)
    small_radius = 150  # Should include nodes at distance 1
    nodes_small_radius = await node.get_nodes_in_radius(
        db=db_session,
        tenant_id=tenant_id,
        center_x=0,
        center_y=0,
        radius=small_radius
    )
    
    # Should include center node and 8 nodes at distance 1 (corners and sides)
    assert len(nodes_small_radius) <= 9
    
    # Check that all nodes are of correct types
    node_types = set()
    for n in nodes_small_radius:
        node_types.add(n.type)
    
    assert "test_center" in node_types
    assert "test_distance_1" in node_types
    assert "test_distance_2" not in node_types  # Should not include distance 2 nodes
    
    # Test with larger radius (should return more nodes)
    large_radius = 350  # Should include nodes at distance 1, 2, 3
    nodes_large_radius = await node.get_nodes_in_radius(
        db=db_session,
        tenant_id=tenant_id,
        center_x=0,
        center_y=0,
        radius=large_radius
    )
    
    assert len(nodes_large_radius) > len(nodes_small_radius)
    
    # Check node types for larger radius
    large_node_types = set()
    for n in nodes_large_radius:
        large_node_types.add(n.type)
    
    assert "test_center" in large_node_types
    assert "test_distance_1" in large_node_types
    assert "test_distance_2" in large_node_types
    assert "test_distance_3" in large_node_types


@pytest.mark.asyncio
async def test_get_nodes_in_viewport(db_session, tenant_id, setup_spatial_nodes):
    """Test getting nodes within a viewport rectangle"""
    # Test with small viewport (top right quadrant)
    nodes_small_viewport = await node.get_nodes_in_viewport(
        db=db_session,
        tenant_id=tenant_id,
        min_x=50,
        min_y=50,
        max_x=250,
        max_y=250
    )
    
    # Should only return nodes in top right quadrant with coordinates between (50,50) and (250,250)
    for n in nodes_small_viewport:
        assert n.x >= 50 and n.x <= 250
        assert n.y >= 50 and n.y <= 250
    
    # Test with larger viewport
    nodes_large_viewport = await node.get_nodes_in_viewport(
        db=db_session,
        tenant_id=tenant_id,
        min_x=-300,
        min_y=-300,
        max_x=300,
        max_y=300
    )
    
    assert len(nodes_large_viewport) > len(nodes_small_viewport)
    
    # Nodes should be in the correct boundaries
    for n in nodes_large_viewport:
        assert n.x >= -300 and n.x <= 300
        assert n.y >= -300 and n.y <= 300


@pytest.mark.asyncio
async def test_get_node_nearest_to(db_session, tenant_id, setup_spatial_nodes):
    """Test finding the node nearest to a specified point"""
    # Find node nearest to point (75, 75) - should be node at (100, 100)
    nearest = await node.get_node_nearest_to(
        db=db_session,
        tenant_id=tenant_id,
        x=75,
        y=75
    )
    
    assert nearest is not None
    nearest_node, distance = nearest
    
    # Check the nearest node is the expected one
    assert nearest_node.x == 100
    assert nearest_node.y == 100
    
    # Check distance is reasonable (should be about 35.35)
    assert 30 < distance < 40
    
    # Try with a different position
    nearest2 = await node.get_node_nearest_to(
        db=db_session,
        tenant_id=tenant_id,
        x=-150,
        y=-250
    )
    
    assert nearest2 is not None
    nearest_node2, distance2 = nearest2
    
    # Check it's a different node than before
    assert nearest_node2.id != nearest_node.id


@pytest.mark.asyncio
async def test_update_position(db_session, tenant_id):
    """Test updating a node's spatial position"""
    # Create a node
    test_node = await node.create(
        db=db_session,
        tenant_id=tenant_id,
        node_type="test_update_position",
        props={"name": "Position Update Node"},
        x=10,
        y=20
    )
    
    # Update position
    updated_node = await node.update_position(
        db=db_session,
        id=test_node.id,
        x=30,
        y=40
    )
    
    # Check coordinates were updated
    assert updated_node.x == 30
    assert updated_node.y == 40
    
    # Clean up
    await db_session.delete(test_node)
    await db_session.commit()