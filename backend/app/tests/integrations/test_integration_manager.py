import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.integrations.manager import IntegrationManager
from app.integrations.exceptions import IntegrationNotFoundError
from app.integrations.models import Integration, IntegrationCredential, IntegrationRun
from app.integrations.registry import ConnectorRegistry


@pytest.fixture
def mock_db():
    """Create a mock database session."""
    db = AsyncMock(spec=AsyncSession)
    
    # Mock the execute method to return a mock result
    db.execute.return_value = AsyncMock()
    db.execute.return_value.scalar_one_or_none = AsyncMock(return_value=None)
    db.execute.return_value.scalars.return_value.all = AsyncMock(return_value=[])
    
    return db


@pytest.fixture
def mock_registry():
    """Create a mock connector registry."""
    registry = MagicMock(spec=ConnectorRegistry)
    registry.get_connector_class.return_value = MagicMock()
    return registry


@pytest.fixture
def integration_manager(mock_db, mock_registry):
    """Create an integration manager with mock dependencies."""
    return IntegrationManager(db=mock_db, registry=mock_registry, tenant_id=uuid.uuid4())


@pytest.mark.asyncio
async def test_register_integration(integration_manager, mock_db):
    """Test registering a new integration."""
    config = {
        "name": "Test Integration",
        "description": "Test integration description",
        "integration_type": "google_calendar",
        "config": {
            "client_id": "test_client_id",
            "client_secret": "test_client_secret"
        },
        "credentials": {
            "access_token": "test_access_token",
            "refresh_token": "test_refresh_token"
        },
        "schedule": "0 0 * * *"
    }
    
    integration_id = await integration_manager.register_integration(config)
    
    assert isinstance(integration_id, uuid.UUID)
    mock_db.add.assert_called()
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_integration(integration_manager, mock_db):
    """Test updating an existing integration."""
    # Mock the get_integration method to return a mock integration
    integration = MagicMock(spec=Integration)
    integration.id = uuid.uuid4()
    integration_manager.get_integration = AsyncMock(return_value=integration)
    
    config = {
        "name": "Updated Integration",
        "config": {
            "updated_key": "updated_value"
        }
    }
    
    result = await integration_manager.update_integration(integration.id, config)
    
    assert result is True
    assert integration.name == "Updated Integration"
    assert integration.config["updated_key"] == "updated_value"
    mock_db.add.assert_called_with(integration)
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_update_integration_not_found(integration_manager):
    """Test updating a non-existent integration."""
    integration_id = uuid.uuid4()
    integration_manager.get_integration = AsyncMock(side_effect=IntegrationNotFoundError)
    
    with pytest.raises(IntegrationNotFoundError):
        await integration_manager.update_integration(integration_id, {})


@pytest.mark.asyncio
async def test_delete_integration(integration_manager, mock_db):
    """Test deleting an integration."""
    # Mock the get_integration method to return a mock integration
    integration = MagicMock(spec=Integration)
    integration.id = uuid.uuid4()
    integration_manager.get_integration = AsyncMock(return_value=integration)
    
    result = await integration_manager.delete_integration(integration.id)
    
    assert result is True
    mock_db.delete.assert_called_with(integration)
    mock_db.commit.assert_called_once()


@pytest.mark.asyncio
async def test_get_integration(integration_manager, mock_db):
    """Test retrieving an integration."""
    integration_id = uuid.uuid4()
    
    # Mock the database response
    mock_integration = MagicMock(spec=Integration)
    mock_integration.id = integration_id
    mock_db.execute.return_value.scalar_one_or_none.return_value = mock_integration
    
    integration = await integration_manager.get_integration(integration_id)
    
    assert integration == mock_integration
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_get_integration_not_found(integration_manager, mock_db):
    """Test retrieving a non-existent integration."""
    integration_id = uuid.uuid4()
    mock_db.execute.return_value.scalar_one_or_none.return_value = None
    
    with pytest.raises(IntegrationNotFoundError):
        await integration_manager.get_integration(integration_id)


@pytest.mark.asyncio
async def test_list_integrations(integration_manager, mock_db):
    """Test listing all integrations."""
    # Mock the database response
    mock_integrations = [MagicMock(spec=Integration) for _ in range(3)]
    mock_db.execute.return_value.scalars.return_value.all.return_value = mock_integrations
    
    integrations = await integration_manager.list_integrations()
    
    assert len(integrations) == 3
    assert integrations == mock_integrations
    mock_db.execute.assert_called_once()


@pytest.mark.asyncio
async def test_run_integration(integration_manager, mock_db, mock_registry):
    """Test running an integration."""
    # Mock the get_integration method to return a mock integration
    integration_id = uuid.uuid4()
    integration = MagicMock(spec=Integration)
    integration.id = integration_id
    integration.integration_type = "google_calendar"
    integration.config = {"client_id": "test"}
    integration_manager.get_integration = AsyncMock(return_value=integration)
    
    # Mock the get_credentials method
    credentials = {"access_token": "test"}
    integration_manager.get_credentials = AsyncMock(return_value=credentials)
    
    # Mock the connector
    mock_connector = AsyncMock()
    mock_connector.connect = AsyncMock(return_value=True)
    mock_connector.fetch_data = AsyncMock()
    mock_connector.fetch_data.return_value.__aiter__.return_value = [{"id": 1, "name": "Test"}]
    mock_registry.create_connector.return_value = mock_connector
    
    # Mock the processor
    mock_processor = AsyncMock()
    mock_processor.process_entity = AsyncMock(return_value={"id": uuid.uuid4()})
    integration_manager.get_processor = AsyncMock(return_value=mock_processor)
    
    result = await integration_manager.run_integration(integration_id, entity_types=["user"])
    
    assert result["status"] == "success"
    assert result["entity_count"] > 0
    mock_db.add.assert_called()  # Should add IntegrationRun
    mock_db.commit.assert_called()
    mock_connector.connect.assert_called_once()
    mock_connector.fetch_data.assert_called_once_with("user", None)


@pytest.mark.asyncio
async def test_run_integration_with_incremental_sync(integration_manager, mock_db, mock_registry):
    """Test running an integration with incremental sync."""
    # Mock the get_integration method to return a mock integration
    integration_id = uuid.uuid4()
    integration = MagicMock(spec=Integration)
    integration.id = integration_id
    integration.integration_type = "google_calendar"
    integration.config = {"client_id": "test"}
    integration_manager.get_integration = AsyncMock(return_value=integration)
    
    # Mock the get_credentials method
    credentials = {"access_token": "test"}
    integration_manager.get_credentials = AsyncMock(return_value=credentials)
    
    # Mock the connector
    mock_connector = AsyncMock()
    mock_connector.connect = AsyncMock(return_value=True)
    mock_connector.fetch_data = AsyncMock()
    mock_connector.fetch_data.return_value.__aiter__.return_value = [{"id": 1, "name": "Test"}]
    mock_registry.create_connector.return_value = mock_connector
    
    # Mock the processor
    mock_processor = AsyncMock()
    mock_processor.process_entity = AsyncMock(return_value={"id": uuid.uuid4()})
    integration_manager.get_processor = AsyncMock(return_value=mock_processor)
    
    # Mock the last successful run
    last_run = MagicMock(spec=IntegrationRun)
    last_run.end_time = datetime.now() - timedelta(days=1)
    last_run.status = "success"
    integration_manager.get_last_successful_run = AsyncMock(return_value=last_run)
    
    result = await integration_manager.run_integration(integration_id, entity_types=["user"], incremental=True)
    
    assert result["status"] == "success"
    assert result["entity_count"] > 0
    mock_connector.fetch_data.assert_called_once_with("user", last_run.end_time)


@pytest.mark.asyncio
async def test_run_integration_connection_failure(integration_manager, mock_registry):
    """Test running an integration with connection failure."""
    # Mock the get_integration method to return a mock integration
    integration_id = uuid.uuid4()
    integration = MagicMock(spec=Integration)
    integration.id = integration_id
    integration.integration_type = "google_calendar"
    integration.config = {"client_id": "test"}
    integration_manager.get_integration = AsyncMock(return_value=integration)
    
    # Mock the get_credentials method
    credentials = {"access_token": "test"}
    integration_manager.get_credentials = AsyncMock(return_value=credentials)
    
    # Mock the connector with connection failure
    mock_connector = AsyncMock()
    mock_connector.connect = AsyncMock(side_effect=Exception("Connection failed"))
    mock_registry.create_connector.return_value = mock_connector
    
    result = await integration_manager.run_integration(integration_id, entity_types=["user"])
    
    assert result["status"] == "failed"
    assert "Connection failed" in result["error"]


@pytest.mark.asyncio
async def test_get_integration_status(integration_manager, mock_db):
    """Test getting integration status."""
    integration_id = uuid.uuid4()
    
    # Mock the get_integration method
    integration = MagicMock(spec=Integration)
    integration.id = integration_id
    integration.name = "Test Integration"
    integration.is_enabled = True
    integration_manager.get_integration = AsyncMock(return_value=integration)
    
    # Mock the database response for runs
    mock_runs = [MagicMock(spec=IntegrationRun) for _ in range(3)]
    for i, run in enumerate(mock_runs):
        run.status = "success" if i < 2 else "failed"
        run.start_time = datetime.now() - timedelta(days=i)
        run.end_time = run.start_time + timedelta(minutes=5)
        run.entity_count = 10
        run.error_count = 0
    
    mock_db.execute.return_value.scalars.return_value.all.return_value = mock_runs
    
    status = await integration_manager.get_integration_status(integration_id)
    
    assert status["integration_id"] == integration_id
    assert status["name"] == "Test Integration"
    assert status["is_enabled"] is True
    assert status["last_run"] is not None
    assert status["success_rate"] == 2/3  # 2 out of 3 runs successful
    assert len(status["recent_runs"]) == 3