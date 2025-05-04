"""
Entity Event Hooks - Provides hooks for entity lifecycle events.

This module sets up event listeners for SQLAlchemy ORM events
to keep the graph database in sync with the entity tables.
"""

import logging
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
from sqlalchemy.orm.session import object_session

from app.models.user import User
from app.models.team import Team
from app.models.project import Project
from app.models.goal import Goal
from app.models.department import Department
from app.services.graph_sync_service import handle_entity_created, handle_entity_updated

logger = logging.getLogger(__name__)

def register_entity_event_hooks():
    """Register event hooks to sync entities with nodes/edges."""
    logger.info("Registering entity event hooks for graph synchronization")
    
    # Helper to handle async operations in SQLAlchemy events
    def _handle_object_created_event(mapper, connection, target):
        """Handle object creation event by scheduling an async task."""
        if not hasattr(target, 'tenant_id'):
            logger.warning(f"Skipping graph sync for entity without tenant_id: {target}")
            return
            
        # Get session associated with this connection
        session = object_session(target)
        if not isinstance(session, AsyncSession):
            logger.warning(f"Skipping graph sync - not an AsyncSession: {session}")
            return
            
        # Schedule async task
        asyncio.create_task(_create_node_async(session, target, target.tenant_id))
    
    async def _create_node_async(session, entity, tenant_id):
        """Create node and edges asynchronously."""
        try:
            await handle_entity_created(session, entity, tenant_id)
        except Exception as e:
            logger.error(f"Error creating node for entity {entity}: {e}")
    
    # Helper to handle entity update events
    def _handle_object_updated_event(mapper, connection, target):
        """Handle object update event by scheduling an async task."""
        if not hasattr(target, 'tenant_id'):
            logger.warning(f"Skipping graph sync for entity without tenant_id: {target}")
            return
            
        # Get session associated with this connection
        session = object_session(target)
        if not isinstance(session, AsyncSession):
            logger.warning(f"Skipping graph sync - not an AsyncSession: {session}")
            return
            
        # Schedule async task
        asyncio.create_task(_update_node_async(session, target, target.tenant_id))
    
    async def _update_node_async(session, entity, tenant_id):
        """Update node and edges asynchronously."""
        try:
            await handle_entity_updated(session, entity, tenant_id)
        except Exception as e:
            logger.error(f"Error updating node for entity {entity}: {e}")
    
    # Register event hooks for each entity type
    entity_types = [User, Team, Project, Goal, Department]
    
    for entity_type in entity_types:
        # After insert event
        event.listen(entity_type, 'after_insert', _handle_object_created_event)
        
        # After update event
        event.listen(entity_type, 'after_update', _handle_object_updated_event)
    
    logger.info(f"Registered graph sync hooks for {len(entity_types)} entity types")