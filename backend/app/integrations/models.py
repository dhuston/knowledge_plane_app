"""
Database models for the integration framework.
"""

from datetime import datetime
from typing import Dict, Any, Optional, List
from uuid import UUID, uuid4

from sqlalchemy import Column, String, Boolean, JSON, ForeignKey, DateTime, Integer
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base


class Integration(Base):
    """
    Integration configuration model.
    
    Represents a configured integration to an external system.
    """
    
    __tablename__ = "integrations"
    
    id = Column(PgUUID(), primary_key=True, default=uuid4)
    tenant_id = Column(PgUUID(), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    integration_type = Column(String, nullable=False, index=True)  # e.g. "google_calendar", "ldap"
    config = Column(JSON, nullable=False, default=dict)  # Connection settings
    is_enabled = Column(Boolean, nullable=False, default=True)
    schedule = Column(String, nullable=True)  # Optional cron expression for scheduling
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    credentials = relationship("IntegrationCredential", back_populates="integration", 
                              cascade="all, delete-orphan", uselist=False)
    runs = relationship("IntegrationRun", back_populates="integration", 
                        cascade="all, delete-orphan")


class IntegrationCredential(Base):
    """
    Integration authentication credentials.
    
    Stored separately for better security.
    """
    
    __tablename__ = "integration_credentials"
    
    integration_id = Column(PgUUID(), ForeignKey("integrations.id"), primary_key=True)
    credential_type = Column(String, nullable=False)  # e.g. "oauth2", "api_key"
    credentials = Column(JSON, nullable=False)  # Encrypted credentials
    expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    integration = relationship("Integration", back_populates="credentials")


class IntegrationRun(Base):
    """
    Integration execution history.
    
    Records results and metrics from integration runs.
    """
    
    __tablename__ = "integration_runs"
    
    id = Column(PgUUID(), primary_key=True, default=uuid4)
    integration_id = Column(PgUUID(), ForeignKey("integrations.id"), nullable=False, index=True)
    status = Column(String, nullable=False)  # "running", "success", "failed", "partial_success"
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    entity_count = Column(Integer, nullable=False, default=0)  # Number of entities processed
    relationship_count = Column(Integer, nullable=False, default=0)  # Number of relationships created
    error_count = Column(Integer, nullable=False, default=0)  # Number of errors encountered
    details = Column(JSON, nullable=False, default=dict)  # Additional details including errors
    
    # Relationships
    integration = relationship("Integration", back_populates="runs")