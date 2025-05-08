# Integration System Migration Guide

This document outlines the steps to migrate from the old integration system to the new streamlined version.

## Summary of Changes

The integration system has been significantly simplified while maintaining all essential functionality:

1. **Removed Complex Registries**: Replaced dynamic class discovery with explicit registration
2. **Consolidated Connectors**: Combined similar connectors to reduce duplication
3. **Simplified Class Hierarchy**: Reduced inheritance depth and made class relationships clearer
4. **Improved Processor Integration**: Built processors directly into connectors
5. **Reduced Boilerplate**: Removed unnecessary abstractions and complex patterns

## Directory Structure

New structure:
```
backend/app/integrations/
├── __init__.py                 # Main exports and types
├── models.py                   # Database models 
├── manager.py                  # Integration manager
├── schemas.py                  # API schemas
├── base.py                     # Simple base interfaces
├── connectors/                 # Connector implementations
│   ├── __init__.py             # Exports all connectors
│   ├── calendar_connector.py   # Combined Google/MS calendar connector
│   ├── ldap_connector.py       # LDAP connector
│   └── research_connector.py   # Research data connector (PubMed)
```

## Migration Steps

### 1. Database Migration

No database schema changes are required. The new system uses the same database models with the same structure.

### 2. Code Migration

The new API endpoints are available at the same routes as before. Use the new integrations module in your code:

```python
# Old import
from app.integrations.manager import IntegrationManager

# New import
from app.integrations.new.manager import IntegrationManager
```

### 3. Configuration Migration

Existing integration configurations are compatible with the new system. No changes are needed in your existing
integration configurations.

## Implementation Plan

1. **Phase 1 - Side-by-Side Operation** (Current Stage)
   - Run both systems in parallel
   - The old system endpoints remain at `/api/v1/integrations/`
   - New system endpoints are available at `/api/v1/integrations_new/`
   
2. **Phase 2 - Migration** (Next Step)
   - Gradually migrate features and connectors
   - Create a data migration script to handle any inconsistencies
   
3. **Phase 3 - Switch Over** (Final Step)
   - Replace old endpoints with new ones
   - Remove the old integration system code
   - Update documentation and frontend components

## Available Connectors

The following connectors are available in the new system:

1. **Google Calendar**
   - Fetch calendar events and schedule
   - Support for incremental sync
   
2. **Microsoft Outlook**
   - Fetch calendar events and schedule
   - Support for email integration (future)

3. **LDAP Directory Service**
   - Fetch users, groups, departments
   - Build organizational structure

4. **PubMed Research**
   - Fetch research papers and publications
   - Extract author and journal information

## Using the New Integration Manager

Here's a quick example of how to use the new integration manager:

```python
from app.integrations.new.manager import IntegrationManager
from sqlalchemy.ext.asyncio import AsyncSession

async def example_usage(db: AsyncSession, tenant_id):
    # Create a manager instance
    manager = IntegrationManager(db=db, tenant_id=tenant_id)
    
    # Register a new integration
    integration_id = await manager.register_integration({
        "name": "Company Directory",
        "integration_type": "ldap",
        "config": {
            "server": "ldap://example.com",
            "base_dn": "dc=example,dc=com"
        },
        "credentials": {
            "type": "basic",
            "bind_dn": "cn=reader,dc=example,dc=com",
            "bind_password": "password123"
        }
    })
    
    # Run the integration
    result = await manager.run_integration(integration_id)
    
    # Get status
    status = await manager.get_integration_status(integration_id)
    
    return status
```

## Future Enhancements

1. Add more specific connector implementations (Jira, Slack, etc.)
2. Improve error handling and retry mechanisms
3. Add robust scheduler for periodic integration runs
4. Enhance processing capabilities with advanced entity reconciliation