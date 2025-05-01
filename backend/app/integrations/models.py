"""Database models for the integration framework."""

from uuid import uuid4
from datetime import datetime

from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base_class import Base


class Integration(Base):
    """Integration configuration model."""
    __tablename__ = "integrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    integration_type = Column(String, nullable=False)  # e.g., "google_calendar", "microsoft_teams"
    config = Column(JSONB, nullable=False, server_default="{}")  # Configuration specific to this integration
    is_enabled = Column(Boolean, default=True, nullable=False)
    schedule = Column(String, nullable=True)  # Cron expression for scheduling
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)
    
    __table_args__ = (
        Index("ix_integrations_tenant_type", "tenant_id", "integration_type"),
    )
    
    def __repr__(self):
        return f"<Integration {self.id} ({self.integration_type})>"


class IntegrationCredential(Base):
    """Secure storage for integration credentials."""
    __tablename__ = "integration_credentials"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    credential_type = Column(String, nullable=False)  # e.g., "oauth2", "api_key", "basic_auth"
    credentials = Column(JSONB, nullable=False)  # Encrypted credentials
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<IntegrationCredential {self.id} ({self.credential_type})>"


class IntegrationRun(Base):
    """Record of integration execution runs."""
    __tablename__ = "integration_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4, nullable=False)
    integration_id = Column(UUID(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(String, nullable=False)  # "running", "success", "failed", "partial_success"
    start_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    entity_count = Column(Integer, default=0, nullable=False)
    relationship_count = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    
    details = Column(JSONB, nullable=True)  # Additional details about the run, including errors
    
    __table_args__ = (
        Index("ix_integration_runs_integration_id_start_time", "integration_id", "start_time"),
    )
    
    def __repr__(self):
        return f"<IntegrationRun {self.id} ({self.status})>"