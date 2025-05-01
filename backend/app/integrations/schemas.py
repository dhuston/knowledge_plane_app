"""Pydantic schemas for the integration framework."""

from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class IntegrationCredentialBase(BaseModel):
    """Base schema for integration credentials."""
    credential_type: str = Field(..., description="Type of credential (oauth2, api_key, etc.)")
    expires_at: Optional[datetime] = Field(None, description="Expiration timestamp for the credentials")


class IntegrationCredentialCreate(IntegrationCredentialBase):
    """Schema for creating integration credentials."""
    credentials: Dict[str, Any] = Field(..., description="Credential data")


class IntegrationCredentialUpdate(IntegrationCredentialBase):
    """Schema for updating integration credentials."""
    credentials: Optional[Dict[str, Any]] = Field(None, description="Updated credential data")


class IntegrationCredential(IntegrationCredentialBase):
    """Schema for returning integration credentials."""
    id: UUID = Field(..., description="Unique identifier for the credential record")
    integration_id: UUID = Field(..., description="ID of the associated integration")
    created_at: datetime = Field(..., description="Timestamp when the record was created")
    updated_at: datetime = Field(..., description="Timestamp when the record was last updated")

    class Config:
        from_attributes = True


class IntegrationBase(BaseModel):
    """Base schema for integration configuration."""
    name: str = Field(..., description="Name of the integration")
    description: Optional[str] = Field(None, description="Description of the integration")
    integration_type: str = Field(..., description="Type of integration (e.g., 'google_calendar')")
    is_enabled: bool = Field(True, description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Cron expression for scheduling")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuration specific to this integration")


class IntegrationCreate(IntegrationBase):
    """Schema for creating an integration."""
    credentials: Optional[Dict[str, Any]] = Field(None, description="Authentication credentials")


class IntegrationUpdate(BaseModel):
    """Schema for updating an integration."""
    name: Optional[str] = Field(None, description="Name of the integration")
    description: Optional[str] = Field(None, description="Description of the integration")
    is_enabled: Optional[bool] = Field(None, description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Cron expression for scheduling")
    config: Optional[Dict[str, Any]] = Field(None, description="Configuration specific to this integration")
    credentials: Optional[Dict[str, Any]] = Field(None, description="Authentication credentials")


class Integration(IntegrationBase):
    """Schema for returning an integration."""
    id: UUID = Field(..., description="Unique identifier for the integration")
    tenant_id: UUID = Field(..., description="ID of the tenant that owns this integration")
    created_at: datetime = Field(..., description="Timestamp when the record was created")
    updated_at: datetime = Field(..., description="Timestamp when the record was last updated")

    class Config:
        from_attributes = True


class IntegrationRunBase(BaseModel):
    """Base schema for integration run records."""
    status: str = Field(..., description="Status of the run (running, success, failed, etc.)")
    start_time: datetime = Field(..., description="Start time of the run")
    end_time: Optional[datetime] = Field(None, description="End time of the run")
    entity_count: int = Field(0, description="Number of entities processed")
    relationship_count: int = Field(0, description="Number of relationships processed")
    error_count: int = Field(0, description="Number of errors encountered")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details about the run")


class IntegrationRunCreate(IntegrationRunBase):
    """Schema for creating an integration run record."""
    pass


class IntegrationRun(IntegrationRunBase):
    """Schema for returning an integration run."""
    id: UUID = Field(..., description="Unique identifier for the run")
    integration_id: UUID = Field(..., description="ID of the integration")

    class Config:
        from_attributes = True


class IntegrationRunBrief(BaseModel):
    """Brief summary of an integration run."""
    id: UUID = Field(..., description="Unique identifier for the run")
    status: str = Field(..., description="Status of the run")
    start_time: datetime = Field(..., description="Start time of the run")
    end_time: Optional[datetime] = Field(None, description="End time of the run")
    entity_count: int = Field(0, description="Number of entities processed")
    error_count: int = Field(0, description="Number of errors encountered")


class IntegrationStatus(BaseModel):
    """Status of an integration."""
    integration_id: UUID = Field(..., description="ID of the integration")
    name: str = Field(..., description="Name of the integration")
    integration_type: str = Field(..., description="Type of integration")
    is_enabled: bool = Field(..., description="Whether the integration is enabled")
    schedule: Optional[str] = Field(None, description="Cron expression for scheduling")
    last_run: Optional[IntegrationRunBrief] = Field(None, description="Details of the last run")
    success_rate: float = Field(..., description="Success rate of recent runs (0-1)")
    recent_runs: List[IntegrationRunBrief] = Field(default_factory=list, description="Recent runs")


class IntegrationRunRequest(BaseModel):
    """Request to run an integration."""
    entity_types: Optional[List[str]] = Field(None, description="Entity types to fetch")
    incremental: bool = Field(False, description="Whether to perform an incremental sync")


class IntegrationRunResult(BaseModel):
    """Result of running an integration."""
    status: str = Field(..., description="Status of the run")
    run_id: UUID = Field(..., description="ID of the run record")
    entity_count: Optional[int] = Field(None, description="Number of entities processed")
    relationship_count: Optional[int] = Field(None, description="Number of relationships processed")
    error_count: Optional[int] = Field(None, description="Number of errors encountered")
    error: Optional[str] = Field(None, description="Error message if the run failed")