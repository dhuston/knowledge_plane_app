"""
Simplified integration manager for external system integration.
"""

import asyncio
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, List, Optional, Type, Tuple, Set
from uuid import UUID, uuid4

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.integrations.base import BaseConnector, BaseProcessor
from app.integrations.models import Integration, IntegrationCredential, IntegrationRun

# Import connectors
from app.integrations.connectors.calendar_connector import GoogleCalendarConnector, MicrosoftOutlookConnector
from app.integrations.connectors.ldap_connector import LDAPConnector
from app.integrations.connectors.research_connector import PubMedConnector

logger = logging.getLogger(__name__)


class IntegrationManager:
    """
    Simplified manager for integration lifecycle.
    
    This class provides methods to manage, configure, and run
    integrations with external systems.
    """
    
    # Static registry of available connectors
    CONNECTOR_REGISTRY = {
        "google_calendar": GoogleCalendarConnector,
        "microsoft_outlook": MicrosoftOutlookConnector,
        "ldap": LDAPConnector,
        "pubmed": PubMedConnector
    }
    
    def __init__(self, db: AsyncSession, tenant_id: UUID = None):
        """
        Initialize the integration manager.
        
        Args:
            db: Database session for persisting integration data
            tenant_id: ID of the current tenant
        """
        self._db = db
        self._tenant_id = tenant_id
        self._processor_cache = {}
    
    def get_connector_class(self, integration_type: str) -> Type[BaseConnector]:
        """
        Get connector class for an integration type.
        
        Args:
            integration_type: Type of integration
            
        Returns:
            Connector class
            
        Raises:
            ValueError: If connector not found
        """
        connector_class = self.CONNECTOR_REGISTRY.get(integration_type)
        if not connector_class:
            raise ValueError(f"No connector found for integration type: {integration_type}")
        return connector_class
    
    def create_connector(self, integration_type: str, config: Dict[str, Any], 
                        credentials: Dict[str, Any]) -> BaseConnector:
        """
        Create a connector instance.
        
        Args:
            integration_type: Type of integration
            config: Configuration dictionary
            credentials: Authentication credentials
            
        Returns:
            Initialized connector instance
            
        Raises:
            ValueError: If connector not found
        """
        connector_class = self.get_connector_class(integration_type)
        return connector_class(config, credentials)
    
    async def register_integration(self, config: Dict[str, Any]) -> UUID:
        """
        Register a new integration.
        
        Args:
            config: Integration configuration including:
                   - name: Name of the integration
                   - description: Optional description
                   - integration_type: Type of integration (e.g., "google_calendar")
                   - config: Configuration specific to this integration type
                   - credentials: Authentication credentials
                   - schedule: Optional cron expression for scheduling
                   
        Returns:
            ID of the newly created integration
            
        Raises:
            Exception: If registration fails
        """
        try:
            # Validate integration type
            integration_type = config.get("integration_type")
            if not integration_type:
                raise ValueError("Integration type is required")
            
            # Make sure connector class exists for this type
            self.get_connector_class(integration_type)
            
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
            await self._db.flush()
            
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
            raise
    
    async def update_integration(self, integration_id: UUID, config: Dict[str, Any]) -> bool:
        """
        Update an existing integration.
        
        Args:
            integration_id: ID of the integration to update
            config: Updated configuration parameters
            
        Returns:
            True if update was successful
            
        Raises:
            Exception: If update fails or integration not found
        """
        integration = await self.get_integration(integration_id)
        
        try:
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
            
        except Exception as e:
            await self._db.rollback()
            logger.error(f"Failed to update integration {integration_id}: {e}")
            raise
    
    async def delete_integration(self, integration_id: UUID) -> bool:
        """
        Delete an integration.
        
        Args:
            integration_id: ID of the integration to delete
            
        Returns:
            True if deletion was successful
            
        Raises:
            Exception: If deletion fails or integration not found
        """
        integration = await self.get_integration(integration_id)
        
        try:
            await self._db.delete(integration)
            await self._db.commit()
            
            logger.info(f"Deleted integration: {integration_id}")
            return True
            
        except Exception as e:
            await self._db.rollback()
            logger.error(f"Failed to delete integration {integration_id}: {e}")
            raise
    
    async def get_integration(self, integration_id: UUID) -> Integration:
        """
        Get integration by ID.
        
        Args:
            integration_id: ID of the integration
            
        Returns:
            Integration record
            
        Raises:
            Exception: If integration not found
        """
        stmt = select(Integration).where(
            (Integration.id == integration_id) & (Integration.tenant_id == self._tenant_id)
        )
        
        result = await self._db.execute(stmt)
        integration = result.scalar_one_or_none()
        
        if not integration:
            raise ValueError(f"Integration not found: {integration_id}")
        
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
            Exception: If integration or credentials not found
        """
        stmt = select(IntegrationCredential).where(
            IntegrationCredential.integration_id == integration_id
        )
        
        result = await self._db.execute(stmt)
        credential_record = result.scalar_one_or_none()
        
        if not credential_record:
            # Return empty credentials if none found
            return {}
        
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
            Exception: If run fails or integration not found
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
        await self._db.flush()
        run_id = run_record.id
        await self._db.commit()
        
        try:
            # Get integration details
            integration_type = integration.integration_type
            config = integration.config
            
            # Get credentials
            credentials = await self.get_credentials(integration_id)
            
            # Create connector instance
            connector = self.create_connector(integration_type, config, credentials)
            
            # Connect to external system
            await connector.connect()
            
            # Get entity types to fetch (default to all if not specified)
            if not entity_types:
                connector_class = self.get_connector_class(integration_type)
                entity_types = connector_class.SUPPORTED_ENTITY_TYPES
            
            # Get last successful run for incremental sync
            last_sync_time = None
            if incremental:
                last_run = await self.get_last_successful_run(integration_id)
                if last_run:
                    last_sync_time = last_run.end_time
            
            # Fetch and process each entity type
            total_entities = 0
            errors = []
            
            for entity_type in entity_types:
                try:
                    # Fetch data from external system
                    entity_count = 0
                    async for raw_data in connector.fetch_data(entity_type, last_sync_time):
                        try:
                            # Process entity using connector's built-in processor
                            entity = await connector.process_entity(raw_data, entity_type)
                            if entity:
                                # Here you would save the entity to your database
                                # For this example, we just count it
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
            run_record = await self._get_run_by_id(run_id)
            run_record.status = "success" if not errors else "partial_success" if total_entities > 0 else "failed"
            run_record.end_time = datetime.now()
            run_record.entity_count = total_entities
            run_record.error_count = len(errors)
            run_record.details = {
                "entity_counts": {et: 0 for et in entity_types},  # To be updated with actual counts
                "errors": errors,
                "incremental": incremental,
                "last_sync_time": last_sync_time.isoformat() if last_sync_time else None
            }
            
            self._db.add(run_record)
            await self._db.commit()
            
            logger.info(f"Integration run {run_id} completed with status: {run_record.status}")
            
            return {
                "status": run_record.status,
                "entity_count": total_entities,
                "error_count": len(errors),
                "run_id": run_id
            }
            
        except Exception as e:
            # Update run record with failure
            run_record = await self._get_run_by_id(run_id)
            run_record.status = "failed"
            run_record.end_time = datetime.now()
            run_record.error_count = 1
            run_record.details = {
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            
            self._db.add(run_record)
            await self._db.commit()
            
            logger.error(f"Integration run {run_id} failed: {e}")
            raise
    
    async def _get_run_by_id(self, run_id: UUID) -> IntegrationRun:
        """Get an integration run by ID."""
        stmt = select(IntegrationRun).where(IntegrationRun.id == run_id)
        result = await self._db.execute(stmt)
        return result.scalar_one()
    
    async def get_integration_status(self, integration_id: UUID) -> Dict[str, Any]:
        """
        Get current status of an integration.
        
        Args:
            integration_id: ID of the integration
            
        Returns:
            Dictionary with integration status information
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