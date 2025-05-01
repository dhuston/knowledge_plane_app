import pytest
import uuid
from unittest.mock import MagicMock, patch, AsyncMock
import pytest_asyncio
from sqlalchemy import Column, String, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql.selectable import Select

from app.core.tenant_context import TenantContext
from app.core.tenant_filter import (
    apply_tenant_filter, 
    tenant_aware_query, 
    register_tenant_events,
    TenantFilterException
)
from app.db.base_class import Base

# Test model for query filtering
class TestModel(Base):
    __tablename__ = "test_model"
    id = Column(UUID(as_uuid=True), primary_key=True)
    tenant_id = Column(UUID(as_uuid=True), index=True, nullable=False)
    name = Column(String, nullable=False)

# Test NonTenantModel (model without tenant_id)
class NonTenantModel(Base):
    __tablename__ = "non_tenant_model"
    id = Column(UUID(as_uuid=True), primary_key=True)
    name = Column(String, nullable=False)

# Test apply_tenant_filter function
def test_apply_tenant_filter_to_query():
    """Test that tenant filter is applied to query."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Create a simple query
    query = select(TestModel)
    
    # Apply tenant filter
    filtered_query = apply_tenant_filter(query, tenant_context)
    
    # Check that WHERE clause contains tenant_id filter
    compiled = filtered_query.compile()
    params = compiled.params
    
    # Check filter was applied
    assert str(tenant_id) in str(params.values())
    assert filtered_query != query  # Queries should be different

def test_apply_tenant_filter_to_already_filtered_query():
    """Test that tenant filter is applied correctly to a query that already has filters."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Create a query with existing filter
    query = select(TestModel).where(TestModel.name == "test")
    
    # Apply tenant filter
    filtered_query = apply_tenant_filter(query, tenant_context)
    
    # Check that both filters are present
    compiled = filtered_query.compile()
    params = compiled.params
    
    # Check original filter remains
    assert "test" in str(params.values())
    # Check tenant filter was added
    assert str(tenant_id) in str(params.values())

def test_apply_tenant_filter_without_tenant_context():
    """Test that applying filter without tenant context raises exception."""
    query = select(TestModel)
    tenant_context = TenantContext()  # Uninitialized
    
    with pytest.raises(TenantFilterException):
        apply_tenant_filter(query, tenant_context)

def test_apply_tenant_filter_to_non_tenant_model():
    """Test that applying filter to a model without tenant_id raises exception."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    query = select(NonTenantModel)
    
    with pytest.raises(TenantFilterException):
        apply_tenant_filter(query, tenant_context)

# Test tenant_aware_query decorator
@pytest.mark.asyncio
async def test_tenant_aware_query_decorator():
    """Test that tenant_aware_query decorator applies tenant filter to query."""
    tenant_id = uuid.uuid4()
    tenant_context = TenantContext(tenant_id=tenant_id)
    
    # Mock execute method that returns awaitable
    execute_mock = AsyncMock()
    
    # Create a mock session
    session_mock = MagicMock()
    session_mock.execute = execute_mock
    
    # Create decorated function
    @tenant_aware_query
    async def get_all_items(db: AsyncSession, tenant_context: TenantContext):
        return await db.execute(select(TestModel))
    
    # Call decorated function
    await get_all_items(session_mock, tenant_context)
    
    # Check that execute was called with filtered query
    assert execute_mock.called
    called_args = execute_mock.call_args[0][0]
    
    # Compile query to check parameters
    compiled = called_args.compile()
    params = compiled.params
    
    # Check tenant filter was applied
    assert str(tenant_id) in str(params.values())

@pytest.mark.asyncio
async def test_tenant_aware_query_without_tenant():
    """Test that tenant_aware_query raises exception without tenant context."""
    tenant_context = TenantContext()  # Uninitialized
    
    # Create a mock session
    session_mock = MagicMock()
    
    # Create decorated function
    @tenant_aware_query
    async def get_all_items(db: AsyncSession, tenant_context: TenantContext):
        return await db.execute(select(TestModel))
    
    # Call decorated function should raise exception
    with pytest.raises(TenantFilterException):
        await get_all_items(session_mock, tenant_context)

# Test SQLAlchemy event listeners
def test_register_tenant_events():
    """Test that register_tenant_events sets up event listeners."""
    with patch("app.core.tenant_filter.event") as mock_event:
        # Call register function
        register_tenant_events()
        
        # Check that event.listen was called for each event we want to intercept
        assert mock_event.listen.called
        
        # We should have at least 2 event registrations (before_compile, before_execute)
        assert mock_event.listen.call_count >= 2

def test_before_compile_query_event():
    """Test the before_compile event handler."""
    # We'll need a proper SQLAlchemy event test here.
    # This is just a placeholder for now and will be expanded
    pass

# Integration tests using SQLAlchemy and in-memory SQLite database
@pytest.mark.asyncio
async def test_query_interceptor_integration():
    """Integration test for query interceptor."""
    # This would be a more complex test with an actual database connection
    # Will be implemented after base functionality is complete
    pass