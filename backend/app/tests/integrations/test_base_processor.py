import pytest
import uuid
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.base_processor import BaseProcessor
from app.integrations.exceptions import ProcessingError
from app.models.node import Node
from app.models.edge import Edge


class MockProcessor(BaseProcessor):
    """Mock processor for testing the BaseProcessor abstract class."""
    
    async def _process_entity(self, raw_data: Dict[str, Any], entity_type: str) -> Optional[Dict[str, Any]]:
        """Mock implementation of _process_entity method."""
        if raw_data.get("fail_processing", False):
            raise ProcessingError("Processing failed")
        
        if entity_type == "user":
            return {
                "id": uuid.uuid4(),
                "type": "user",
                "props": {
                    "name": raw_data.get("name", "Unknown"),
                    "email": raw_data.get("email"),
                    "external_id": raw_data.get("id")
                }
            }
        return None
    
    async def _process_relationship(self, source_entity: Dict[str, Any], target_entity: Dict[str, Any], relationship_type: str = None) -> Optional[Dict[str, Any]]:
        """Mock implementation of _process_relationship method."""
        if source_entity.get("fail_processing", False) or target_entity.get("fail_processing", False):
            raise ProcessingError("Relationship processing failed")
        
        return {
            "id": uuid.uuid4(),
            "src": source_entity.get("id"),
            "dst": target_entity.get("id"),
            "label": relationship_type or "RELATED_TO",
            "props": {
                "created_at": datetime.now().isoformat()
            }
        }


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = AsyncMock(spec=AsyncSession)
    return db


@pytest.fixture
def processor(mock_db):
    """Create a processor with mock dependencies."""
    tenant_id = uuid.uuid4()
    return MockProcessor(db=mock_db, tenant_id=tenant_id)


@pytest.mark.asyncio
async def test_process_entity_success(processor):
    """Test successful entity processing."""
    raw_data = {
        "id": "ext123",
        "name": "John Doe",
        "email": "john@example.com"
    }
    
    result = await processor.process_entity(raw_data, "user")
    
    assert result is not None
    assert result["type"] == "user"
    assert result["props"]["name"] == "John Doe"
    assert result["props"]["email"] == "john@example.com"
    assert result["props"]["external_id"] == "ext123"
    processor._db.add.assert_called()
    processor._db.commit.assert_called()


@pytest.mark.asyncio
async def test_process_entity_failure(processor):
    """Test entity processing failure."""
    raw_data = {
        "fail_processing": True
    }
    
    with pytest.raises(ProcessingError) as excinfo:
        await processor.process_entity(raw_data, "user")
    
    assert "Processing failed" in str(excinfo.value)
    processor._db.add.assert_not_called()


@pytest.mark.asyncio
async def test_process_entity_invalid_type(processor):
    """Test processing with invalid entity type."""
    raw_data = {
        "id": "ext123",
        "name": "Invalid Entity"
    }
    
    result = await processor.process_entity(raw_data, "invalid_type")
    
    assert result is None
    processor._db.add.assert_not_called()


@pytest.mark.asyncio
async def test_find_existing_entity(processor, mock_db):
    """Test finding an existing entity."""
    # Mock database response
    mock_node = MagicMock(spec=Node)
    mock_node.id = uuid.uuid4()
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_node
    
    entity_data = {
        "type": "user",
        "external_id": "ext123"
    }
    
    existing = await processor.find_existing_entity(entity_data)
    
    assert existing == mock_node
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_find_existing_entity_not_found(processor, mock_db):
    """Test finding a non-existing entity."""
    mock_db.execute.return_value.scalar_one_or_none.return_value = None
    
    entity_data = {
        "type": "user",
        "external_id": "ext123"
    }
    
    existing = await processor.find_existing_entity(entity_data)
    
    assert existing is None
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_process_relationship_success(processor):
    """Test successful relationship processing."""
    source = {
        "id": uuid.uuid4(),
        "type": "user",
        "props": {"name": "John Doe"}
    }
    
    target = {
        "id": uuid.uuid4(),
        "type": "team",
        "props": {"name": "Engineering"}
    }
    
    result = await processor.process_relationship(source, target, "MEMBER_OF")
    
    assert result is not None
    assert result["src"] == source["id"]
    assert result["dst"] == target["id"]
    assert result["label"] == "MEMBER_OF"
    processor._db.add.assert_called()
    processor._db.commit.assert_called()


@pytest.mark.asyncio
async def test_process_relationship_failure(processor):
    """Test relationship processing failure."""
    source = {"fail_processing": True, "id": uuid.uuid4()}
    target = {"id": uuid.uuid4()}
    
    with pytest.raises(ProcessingError) as excinfo:
        await processor.process_relationship(source, target)
    
    assert "Relationship processing failed" in str(excinfo.value)
    processor._db.add.assert_not_called()


@pytest.mark.asyncio
async def test_find_existing_relationship(processor, mock_db):
    """Test finding an existing relationship."""
    # Mock database response
    mock_edge = MagicMock(spec=Edge)
    mock_edge.id = uuid.uuid4()
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_edge
    
    source_id = uuid.uuid4()
    target_id = uuid.uuid4()
    
    existing = await processor.find_existing_relationship(source_id, target_id, "MEMBER_OF")
    
    assert existing == mock_edge
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_create_node_from_entity(processor):
    """Test creating a node from entity data."""
    entity_data = {
        "type": "user",
        "props": {
            "name": "John Doe",
            "email": "john@example.com"
        }
    }
    
    node = processor.create_node_from_entity(entity_data)
    
    assert node.type == "user"
    assert node.props["name"] == "John Doe"
    assert node.props["email"] == "john@example.com"
    assert node.tenant_id == processor._tenant_id


@pytest.mark.asyncio
async def test_create_edge_from_relationship(processor):
    """Test creating an edge from relationship data."""
    relationship_data = {
        "src": uuid.uuid4(),
        "dst": uuid.uuid4(),
        "label": "MEMBER_OF",
        "props": {
            "role": "Developer",
            "joined_at": "2023-01-01"
        }
    }
    
    edge = processor.create_edge_from_relationship(relationship_data)
    
    assert edge.src == relationship_data["src"]
    assert edge.dst == relationship_data["dst"]
    assert edge.label == "MEMBER_OF"
    assert edge.props["role"] == "Developer"
    assert edge.tenant_id == processor._tenant_id