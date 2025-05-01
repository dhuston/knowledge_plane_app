import pytest
import uuid
from unittest.mock import MagicMock, patch, AsyncMock
import pytest_asyncio
from sqlalchemy import select, insert, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tenant_context import TenantContext
from app.core.tenant_validation import (
    validate_tenant_access,
    TenantAccessViolationError,
    validate_create_operation,
    validate_update_operation,
    validate_delete_operation,
    TenantValidationService,
    create_validation_report
)

# Mock models for testing
class MockUserModel:
    __tablename__ = "users"
    tenant_id = None

class MockProjectModel:
    __tablename__ = "projects"
    tenant_id = None

# Test basic tenant access validation
def test_validate_tenant_access():
    """Test tenant access validation for objects."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Object with matching tenant_id
    obj = MagicMock()
    obj.tenant_id = tenant_id
    
    # This should not raise an exception
    validate_tenant_access(obj, tenant_context)
    
    # Object with different tenant_id
    obj2 = MagicMock()
    obj2.tenant_id = uuid.uuid4()  # Different ID
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        validate_tenant_access(obj2, tenant_context)

def test_validate_tenant_access_without_tenant_id():
    """Test tenant access validation for objects without tenant_id."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Object without tenant_id
    obj = MagicMock()
    obj.tenant_id = None
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        validate_tenant_access(obj, tenant_context)

def test_validate_tenant_access_without_context():
    """Test tenant access validation without tenant context."""
    obj = MagicMock()
    obj.tenant_id = uuid.uuid4()
    
    tenant_context = TenantContext()  # Uninitialized
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        validate_tenant_access(obj, tenant_context)

# Test create operation validation
@pytest.mark.asyncio
async def test_validate_create_operation_with_valid_tenant_id():
    """Test validation of create operation with valid tenant ID."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Create operation data with correct tenant_id
    create_data = {
        "name": "Test",
        "tenant_id": tenant_id
    }
    
    # This should not raise an exception
    await validate_create_operation(session, MockUserModel, create_data, tenant_context)

@pytest.mark.asyncio
async def test_validate_create_operation_with_invalid_tenant_id():
    """Test validation of create operation with invalid tenant ID."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Create operation data with incorrect tenant_id
    create_data = {
        "name": "Test",
        "tenant_id": uuid.uuid4()  # Different ID
    }
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        await validate_create_operation(session, MockUserModel, create_data, tenant_context)

@pytest.mark.asyncio
async def test_validate_create_operation_without_tenant_id():
    """Test validation of create operation without tenant ID."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Create operation data without tenant_id
    create_data = {
        "name": "Test",
        # No tenant_id
    }
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        await validate_create_operation(session, MockUserModel, create_data, tenant_context)

# Test update operation validation
@pytest.mark.asyncio
async def test_validate_update_operation_with_valid_tenant():
    """Test validation of update operation with valid tenant."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Mock existing object with correct tenant_id
    obj = MagicMock()
    obj.tenant_id = tenant_id
    
    # Mock session.get to return our mock object
    session.get = AsyncMock(return_value=obj)
    
    # Update operation data
    update_data = {
        "name": "Updated Name"
    }
    
    # Mock object ID
    obj_id = uuid.uuid4()
    
    # This should not raise an exception
    await validate_update_operation(session, MockUserModel, obj_id, update_data, tenant_context)

async def test_validate_update_operation_with_invalid_tenant():
    """Test validation of update operation with invalid tenant."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Mock existing object with incorrect tenant_id
    obj = MagicMock()
    obj.tenant_id = uuid.uuid4()  # Different ID
    
    # Mock session.get to return our mock object
    session.get = AsyncMock(return_value=obj)
    
    # Update operation data
    update_data = {
        "name": "Updated Name"
    }
    
    # Mock object ID
    obj_id = uuid.uuid4()
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        await validate_update_operation(session, MockUserModel, obj_id, update_data, tenant_context)

async def test_validate_update_operation_nonexistent_object():
    """Test validation of update operation for nonexistent object."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Mock session.get to return None (object not found)
    session.get = AsyncMock(return_value=None)
    
    # Update operation data
    update_data = {
        "name": "Updated Name"
    }
    
    # Mock object ID
    obj_id = uuid.uuid4()
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        await validate_update_operation(session, MockUserModel, obj_id, update_data, tenant_context)

# Test delete operation validation
async def test_validate_delete_operation_with_valid_tenant():
    """Test validation of delete operation with valid tenant."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Mock existing object with correct tenant_id
    obj = MagicMock()
    obj.tenant_id = tenant_id
    
    # Mock session.get to return our mock object
    session.get = AsyncMock(return_value=obj)
    
    # Mock object ID
    obj_id = uuid.uuid4()
    
    # This should not raise an exception
    await validate_delete_operation(session, MockUserModel, obj_id, tenant_context)

async def test_validate_delete_operation_with_invalid_tenant():
    """Test validation of delete operation with invalid tenant."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Mock existing object with incorrect tenant_id
    obj = MagicMock()
    obj.tenant_id = uuid.uuid4()  # Different ID
    
    # Mock session.get to return our mock object
    session.get = AsyncMock(return_value=obj)
    
    # Mock object ID
    obj_id = uuid.uuid4()
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        await validate_delete_operation(session, MockUserModel, obj_id, tenant_context)

async def test_validate_delete_operation_nonexistent_object():
    """Test validation of delete operation for nonexistent object."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock DB session
    session = AsyncMock()
    
    # Mock session.get to return None (object not found)
    session.get = AsyncMock(return_value=None)
    
    # Mock object ID
    obj_id = uuid.uuid4()
    
    # This should raise an exception
    with pytest.raises(TenantAccessViolationError):
        await validate_delete_operation(session, MockUserModel, obj_id, tenant_context)

# Test TenantValidationService
def test_tenant_validation_service_initialization():
    """Test initialization of TenantValidationService."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    service = TenantValidationService(tenant_context)
    
    assert service.tenant_context == tenant_context
    assert service.tenant_id == tenant_id
    assert service.validation_errors == []

def test_tenant_validation_service_add_error():
    """Test adding errors to the validation service."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    service = TenantValidationService(tenant_context)
    
    service.add_error("users", "User access violation", {"user_id": "123"})
    
    assert len(service.validation_errors) == 1
    assert service.validation_errors[0]["entity_type"] == "users"
    assert service.validation_errors[0]["message"] == "User access violation"
    assert service.validation_errors[0]["details"]["user_id"] == "123"

def test_tenant_validation_report_creation():
    """Test creating a validation report."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    service = TenantValidationService(tenant_context)
    
    service.add_error("users", "User access violation", {"user_id": "123"})
    service.add_error("projects", "Project access violation", {"project_id": "456"})
    
    report = create_validation_report(service)
    
    assert report["tenant_id"] == str(tenant_id)
    assert report["timestamp"] is not None
    assert report["error_count"] == 2
    assert len(report["errors"]) == 2
    assert report["errors"][0]["entity_type"] == "users"
    assert report["errors"][1]["entity_type"] == "projects"

# Integration tests for validation in real-world scenarios would go here