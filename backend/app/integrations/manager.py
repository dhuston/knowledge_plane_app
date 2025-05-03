"""Integration manager for the integration framework."""

import asyncio
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional, Type, Tuple, Set
from uuid import UUID, uuid4

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.base_connector import BaseConnector
from app.integrations.base_processor import BaseProcessor
from app.integrations.exceptions import IntegrationError, IntegrationNotFoundError
from app.integrations.models import Integration, IntegrationCredential, IntegrationRun
from app.integrations.registry import connector_registry

logger = logging.getLogger(__name__)


class IntegrationManager:
    """
    Manager for integration lifecycle.
    
    This class provides methods to register, configure, run, and monitor
    integrations with external systems.
    
    Attributes:
        _db: Database session for persisting integration data
        _tenant_id: ID of the current tenant
    """
    
    def __init__(self, db: AsyncSession, registry=None, tenant_id: UUID = None):
        """
        Initialize the integration manager.
        
        Args:
            db: Database session for persisting integration data
            registry: Optional connector registry (defaults to global singleton)
            tenant_id: ID of the current tenant
        """
        self._db = db
        self._registry = registry or connector_registry
        self._tenant_id = tenant_id
        self._processors = {}
    
    async def register_integration(self, config: Dict[str, Any]) -> UUID:
        """
        Register a new integration.
        
        Args:
            config: Integration configuration including:
                   - name: Name of the integration
                   - description: Optional description
                   - integration_type: Type of integration (e.g., "google_calendar")
                   - config: Configuration specific to this integration type
                   - credentials: Authentication credentials (will be stored securely)
                   - schedule: Optional cron expression for scheduling
                   
        Returns:
            ID of the newly created integration
            
        Raises:
            IntegrationError: If registration fails
        """
        try:
            # Validate integration type
            integration_type = config.get("integration_type")
            if not integration_type:
                raise IntegrationError("Integration type is required")
            
            # Make sure connector class exists for this type
            self._registry.get_connector_class(integration_type)
            
            # Extract credentials for secure storage
            credentials = config.pop("credentials", {})
            credential_type = credentials.get("type", "generic")
            
            # Create integration record
            integration = Integration(
                id=uuid4(),
                tenant_id=self._tenant_id,
                name=config.get("name", f"New {integration_type} Integration"),
                description=config.get("description"),
                integration_type=integration_type,
                config=config.get("config", {}),
                is_enabled=config.get("is_enabled", True),
                schedule=config.get("schedule")
            )
            
            self._db.add(integration)
            await self._db.commit()
            
            # Store credentials if provided
            if credentials:
                credential_record = IntegrationCredential(
                    integration_id=integration.id,
                    credential_type=credential_type,
                    credentials=credentials,
                    expires_at=credentials.get("expires_at")
                )
                self._db.add(credential_record)
                await self._db.commit()
            
            logger.info(f"Registered new integration: {integration.id} ({integration.name})")
            return integration.id
            
        except Exception as e:
            await self._db.rollback()
            logger.error(f"Failed to register integration: {e}")
            raise IntegrationError(f"Failed to register integration: {e}")
    
    async def update_integration(self, integration_id: UUID, config: Dict[str, Any]) -> bool:
        """
        Update an existing integration.
        
        Args:
            integration_id: ID of the integration to update
            config: Updated configuration parameters
            
        Returns:
            True if update was successful
            
        Raises:
            IntegrationNotFoundError: If integration not found
            IntegrationError: If update fails
        """
        try:
            integration = await self.get_integration(integration_id)
            
            # Update integration fields
            if "name" in config:
                integration.name = config["name"]
            if "description" in config:
                integration.description = config["description"]
            if "config" in config:
                integration.config.update(config["config"])
            if "is_enabled" in config:
                integration.is_enabled = config["is_enabled"]
            if "schedule" in config:
                integration.schedule = config["schedule"]
            
            self._db.add(integration)
            
            # Update credentials if provided
            if "credentials" in config:
                credentials = config["credentials"]
                credential_type = credentials.get("type", "generic")
                
                # Find existing credential record
                stmt = select(IntegrationCredential).where(
                    IntegrationCredential.integration_id == integration_id
                )
                result = await self._db.execute(stmt)
                credential_record = result.scalar_one_or_none()
                
                if credential_record:
                    # Update existing credential record
                    credential_record.credential_type = credential_type
                    credential_record.credentials = credentials
                    credential_record.expires_at = credentials.get("expires_at")
                    self._db.add(credential_record)
                else:
                    # Create new credential record
                    credential_record = IntegrationCredential(
                        integration_id=integration_id,
                        credential_type=credential_type,
                        credentials=credentials,
                        expires_at=credentials.get("expires_at")
                    )
                    self._db.add(credential_record)
            
            await self._db.commit()
            logger.info(f"Updated integration: {integration_id}")
            return True
            
        except IntegrationNotFoundError:
            raise
        except Exception as e:
            await self._db.rollback()
            logger.error(f"Failed to update integration {integration_id}: {e}")
            raise IntegrationError(f"Failed to update integration: {e}")
    
    async def delete_integration(self, integration_id: UUID) -> bool:
        """
        Delete an integration.
        
        Args:
            integration_id: ID of the integration to delete
            
        Returns:
            True if deletion was successful
            
        Raises:
            IntegrationNotFoundError: If integration not found
            IntegrationError: If deletion fails
        """
        try:
            integration = await self.get_integration(integration_id)
            
            self._db.delete(integration)
            await self._db.commit()
            
            logger.info(f"Deleted integration: {integration_id}")
            return True
            
        except IntegrationNotFoundError:
            raise
        except Exception as e:
            await self._db.rollback()
            logger.error(f"Failed to delete integration {integration_id}: {e}")
            raise IntegrationError(f"Failed to delete integration: {e}")
    
    async def get_integration(self, integration_id: UUID) -> Integration:
        """
        Get integration by ID.
        
        Args:
            integration_id: ID of the integration
            
        Returns:
            Integration record
            
        Raises:
            IntegrationNotFoundError: If integration not found
        """
        stmt = select(Integration).where(
            (Integration.id == integration_id) & (Integration.tenant_id == self._tenant_id)
        )
        
        result = await self._db.execute(stmt)
        integration = result.scalar_one_or_none()
        
        if not integration:
            raise IntegrationNotFoundError(f"Integration not found: {integration_id}")
        
        return integration
    
    async def list_integrations(self, integration_type: Optional[str] = None) -> List[Integration]:
        """
        List all integrations for the current tenant.
        
        Args:
            integration_type: Optional filter by integration type
            
        Returns:
            List of integration records
        """
        stmt = select(Integration).where(Integration.tenant_id == self._tenant_id)
        
        if integration_type:
            stmt = stmt.where(Integration.integration_type == integration_type)
        
        result = await self._db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_credentials(self, integration_id: UUID) -> Dict[str, Any]:
        """
        Get credentials for an integration.
        
        Args:
            integration_id: ID of the integration
            
        Returns:
            Credentials dictionary
            
        Raises:
            IntegrationNotFoundError: If integration or credentials not found
        """
        stmt = select(IntegrationCredential).where(
            IntegrationCredential.integration_id == integration_id
        )
        
        result = await self._db.execute(stmt)
        credential_record = result.scalar_one_or_none()
        
        if not credential_record:
            raise IntegrationNotFoundError(f"No credentials found for integration: {integration_id}")
        
        return credential_record.credentials
    
    async def run_integration(
        self, 
        integration_id: UUID, 
        entity_types: Optional[List[str]] = None,
        incremental: bool = False
    ) -> Dict[str, Any]:
        """
        Run an integration manually.
        
        Args:
            integration_id: ID of the integration to run
            entity_types: Optional list of entity types to fetch
            incremental: Whether to perform an incremental sync
            
        Returns:
            Dictionary with run results
            
        Raises:
            IntegrationNotFoundError: If integration not found
            IntegrationError: If run fails
        """
        integration = await self.get_integration(integration_id)
        
        # Create run record
        run_record = IntegrationRun(
            integration_id=integration_id,
            status="running",
            start_time=datetime.now(),
            details={}
        )
        self._db.add(run_record)
        await self._db.commit()
        
        try:
            # Get integration details
            integration_type = integration.integration_type
            config = integration.config
            
            # Get credentials
            try:
                credentials = await self.get_credentials(integration_id)
            except IntegrationNotFoundError:
                credentials = {}
            
            # Create connector instance
            connector = self._registry.create_connector(integration_type, config, credentials)
            
            # Connect to external system
            await connector.connect()
            
            # Get entity types to fetch (default to all if not specified)
            if not entity_types:
                # This should be defined by the connector class
                connector_class = self._registry.get_connector_class(integration_type)
                entity_types = getattr(connector_class, "SUPPORTED_ENTITY_TYPES", ["default"])
            
            # Get last successful run for incremental sync
            last_sync_time = None
            if incremental:
                last_run = await self.get_last_successful_run(integration_id)
                if last_run:
                    last_sync_time = last_run.end_time
            
            # Fetch and process each entity type
            total_entities = 0
            total_relationships = 0
            errors = []
            
            for entity_type in entity_types:
                try:
                    processor = await self.get_processor(integration_type, entity_type)
                    
                    # Fetch data from external system
                    entity_count = 0
                    async for raw_data in connector.fetch_data(entity_type, last_sync_time):
                        try:
                            # Process entity
                            entity = await processor.process_entity(raw_data, entity_type)
                            if entity:
                                entity_count += 1
                                total_entities += 1
                        except Exception as e:
                            errors.append({
                                "entity_type": entity_type,
                                "error": str(e),
                                "traceback": traceback.format_exc()
                            })
                    
                    logger.info(f"Processed {entity_count} entities of type {entity_type}")
                    
                except Exception as e:
                    errors.append({
                        "entity_type": entity_type,
                        "error": str(e),
                        "traceback": traceback.format_exc()
                    })
            
            # Update run record
            run_record.status = "success" if not errors else "partial_success" if total_entities > 0 else "failed"
            run_record.end_time = datetime.now()
            run_record.entity_count = total_entities
            run_record.relationship_count = total_relationships
            run_record.error_count = len(errors)
            run_record.details = {
                "entity_counts": {et: 0 for et in entity_types},  # This should be updated with actual counts
                "errors": errors,
                "incremental": incremental,
                "last_sync_time": last_sync_time.isoformat() if last_sync_time else None
            }
            
            self._db.add(run_record)
            await self._db.commit()
            
            logger.info(f"Integration run {run_record.id} completed with status: {run_record.status}")
            
            return {
                "status": run_record.status,
                "entity_count": total_entities,
                "relationship_count": total_relationships,
                "error_count": len(errors),
                "run_id": run_record.id
            }
            
        except Exception as e:
            # Update run record with failure
            run_record.status = "failed"
            run_record.end_time = datetime.now()
            run_record.error_count = 1
            run_record.details = {
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            
            self._db.add(run_record)
            await self._db.commit()
            
            logger.error(f"Integration run {run_record.id} failed: {e}")
            
            return {
                "status": "failed",
                "error": str(e),
                "run_id": run_record.id
            }
    
    async def get_integration_status(self, integration_id: UUID) -> Dict[str, Any]:
        """
        Get current status of an integration.
        
        Args:
            integration_id: ID of the integration
            
        Returns:
            Dictionary with integration status information
            
        Raises:
            IntegrationNotFoundError: If integration not found
        """
        # Get integration details
        integration = await self.get_integration(integration_id)
        
        # Get recent runs
        stmt = select(IntegrationRun).where(
            IntegrationRun.integration_id == integration_id
        ).order_by(desc(IntegrationRun.start_time)).limit(10)
        
        result = await self._db.execute(stmt)
        recent_runs = list(result.scalars().all())
        
        # Calculate success rate
        success_count = sum(1 for run in recent_runs if run.status == "success")
        success_rate = success_count / len(recent_runs) if recent_runs else 0
        
        # Get last run
        last_run = recent_runs[0] if recent_runs else None
        
        return {
            "integration_id": integration_id,
            "name": integration.name,
            "integration_type": integration.integration_type,
            "is_enabled": integration.is_enabled,
            "schedule": integration.schedule,
            "last_run": {
                "id": last_run.id,
                "status": last_run.status,
                "start_time": last_run.start_time,
                "end_time": last_run.end_time,
                "entity_count": last_run.entity_count,
                "error_count": last_run.error_count
            } if last_run else None,
            "success_rate": success_rate,
            "recent_runs": [
                {
                    "id": run.id,
                    "status": run.status,
                    "start_time": run.start_time,
                    "end_time": run.end_time,
                    "entity_count": run.entity_count,
                    "error_count": run.error_count
                }
                for run in recent_runs
            ]
        }
    
    async def get_processor(self, integration_type: str, entity_type: str) -> BaseProcessor:
        """
        Get an appropriate processor for an integration and entity type.
        
        Args:
            integration_type: Type of integration
            entity_type: Type of entity
            
        Returns:
            Processor instance
            
        Raises:
            IntegrationError: If no processor found
        """
        from app.integrations.processor_registry import processor_registry
        
        # Cache processor instances by integration_type and entity_type
        cache_key = f"{integration_type}:{entity_type}"
        if cache_key in self._processors:
            return self._processors[cache_key]
        
        # First try to get a processor based on entity type
        processor = processor_registry.get_processor_for_entity(entity_type, self._db, self._tenant_id)
        
        # If that fails, try based on integration type
        if not processor:
            processor = processor_registry.get_processor_for_integration(integration_type, self._db, self._tenant_id)
        
        self._processors[cache_key] = processor
        return processor
    
    async def get_last_successful_run(self, integration_id: UUID) -> Optional[IntegrationRun]:
        """
        Get the last successful run of an integration.
        
        Args:
            integration_id: ID of the integration
            
        Returns:
            Last successful run record or None if no successful runs
        """
        stmt = select(IntegrationRun).where(
            (IntegrationRun.integration_id == integration_id) &
            (IntegrationRun.status == "success")
        ).order_by(desc(IntegrationRun.end_time)).limit(1)
        
        result = await self._db.execute(stmt)
        return result.scalar_one_or_none()