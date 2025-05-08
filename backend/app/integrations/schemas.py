"""
API schemas for integration data structures.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class IntegrationCredentials(BaseModel):
    """Credentials for authentication with external systems."""
    
    type: str = Field(..., description="Type of credentials (e.g., 'oauth2', 'api_key')")
    credentials: Dict[str, Any] = Field(..., description="Credential data")
    expires_at: Optional[datetime] = Field(None, description="Expiration date for the credentials")


class IntegrationCreate(BaseModel):
    """Schema for creating a new integration."""
    
    name: str = Field(..., description="Name of the integration")
    description: Optional[str] = Field(None, description="Description of the integration")
    integration_type: str = Field(..., description="Type of integration (e.g., 'google_calendar', 'ldap')")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration for the integration")
    credentials: Optional[IntegrationCredentials] = Field(None, description="Authentication credentials")
    is_enabled: bool = Field(default=True, description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Optional cron expression for scheduling")


class IntegrationUpdate(BaseModel):
    """Schema for updating an existing integration."""
    
    name: Optional[str] = Field(None, description="Name of the integration")
    description: Optional[str] = Field(None, description="Description of the integration")
    config: Optional[Dict[str, Any]] = Field(None, description="Configuration for the integration")
    credentials: Optional[IntegrationCredentials] = Field(None, description="Authentication credentials")
    is_enabled: Optional[bool] = Field(None, description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Optional cron expression for scheduling")


class IntegrationRunInfo(BaseModel):
    """Information about an integration run."""
    
    id: UUID = Field(..., description="Run ID")
    status: str = Field(..., description="Run status")
    start_time: datetime = Field(..., description="Start time of the run")
    end_time: Optional[datetime] = Field(None, description="End time of the run")
    entity_count: int = Field(default=0, description="Number of entities processed")
    error_count: int = Field(default=0, description="Number of errors encountered")


class Integration(BaseModel):
    """Schema for integration details."""
    
    id: UUID = Field(..., description="Integration ID")
    name: str = Field(..., description="Name of the integration")
    description: Optional[str] = Field(None, description="Description of the integration")
    integration_type: str = Field(..., description="Type of integration")
    config: Dict[str, Any] = Field(default_factory=dict, description="Integration configuration")
    is_enabled: bool = Field(..., description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Cron expression for scheduling")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        from_attributes = True


class IntegrationStatus(BaseModel):
    """Status information for an integration."""
    
    integration_id: UUID = Field(..., description="Integration ID")
    name: str = Field(..., description="Integration name")
    integration_type: str = Field(..., description="Integration type")
    is_enabled: bool = Field(..., description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Cron schedule if any")
    last_run: Optional[IntegrationRunInfo] = Field(None, description="Last run information")
    success_rate: float = Field(..., description="Success rate percentage")
    recent_runs: List[IntegrationRunInfo] = Field(default_factory=list, description="Recent runs")


class IntegrationRunRequest(BaseModel):
    """Request for running an integration."""
    
    entity_types: Optional[List[str]] = Field(None, description="Types of entities to fetch")
    incremental: bool = Field(default=True, description="Whether to perform incremental sync")


class IntegrationRunResult(BaseModel):
    """Result of running an integration."""
    
    status: str = Field(..., description="Status of the run")
    entity_count: int = Field(..., description="Number of entities processed")
    error_count: int = Field(..., description="Number of errors encountered")
    run_id: UUID = Field(..., description="ID of the run")


class IntegrationRun(BaseModel):
    """Schema for integration run details."""
    
    id: UUID = Field(..., description="Run ID")
    integration_id: UUID = Field(..., description="Integration ID")
    status: str = Field(..., description="Run status")
    start_time: datetime = Field(..., description="Start time of the run")
    end_time: Optional[datetime] = Field(None, description="End time of the run")
    entity_count: int = Field(default=0, description="Number of entities processed")
    error_count: int = Field(default=0, description="Number of errors encountered")
    details: Dict[str, Any] = Field(default_factory=dict, description="Additional details")
    
    class Config:
        from_attributes = True