from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Table
from sqlalchemy.orm import relationship
from app.db.base_class import Base

# Import models to avoid circular imports
from app.models.node import Node
from app.models.user import User


class RelationshipType(str, Enum):
    TEAM_MEMBERSHIP = "team_membership"
    PROJECT_ASSIGNMENT = "project_assignment"
    REPORTING = "reporting"
    COLLABORATION = "collaboration"
    GOAL_ALIGNMENT = "goal_alignment"
    KNOWLEDGE_SHARING = "knowledge_sharing"


class RelationshipStrength(Base):
    """Model for storing calculated relationship strengths between entities."""
    __tablename__ = "relationship_strengths"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    target_id = Column(Integer, ForeignKey("nodes.id"), nullable=False)
    relationship_type = Column(String, nullable=False)
    strength_value = Column(Float, default=0.0)
    confidence_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
    relationship_metadata = Column(String)  # JSON-encoded metadata about the relationship
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    # Relationships
    source = relationship("Node", foreign_keys=[source_id], back_populates="outgoing_strengths")
    target = relationship("Node", foreign_keys=[target_id], back_populates="incoming_strengths")


# Add relationship properties to Node model in a way that doesn't modify the existing file
# This would typically be added to the Node class in node.py, but we're creating it here
# for demonstration purposes
Node.outgoing_strengths = relationship(
    "RelationshipStrength",
    foreign_keys="RelationshipStrength.source_id",
    back_populates="source"
)

Node.incoming_strengths = relationship(
    "RelationshipStrength",
    foreign_keys="RelationshipStrength.target_id",
    back_populates="target"
)


class EmergentPattern(Base):
    """Model for storing detected organizational patterns."""
    __tablename__ = "emergent_patterns"

    id = Column(Integer, primary_key=True, index=True)
    pattern_type = Column(String, nullable=False)
    confidence_score = Column(Float, default=0.0)
    detection_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    description = Column(String)
    pattern_metadata = Column(String)  # JSON-encoded details about the pattern
    is_validated = Column(Boolean, default=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    # Many-to-many relationship with Node
    nodes = relationship(
        "Node",
        secondary="pattern_nodes",
        back_populates="patterns"
    )


# Junction table for EmergentPattern to Node many-to-many relationship
pattern_nodes = Table(
    "pattern_nodes",
    Base.metadata,
    Column("pattern_id", Integer, ForeignKey("emergent_patterns.id"), primary_key=True),
    Column("node_id", Integer, ForeignKey("nodes.id"), primary_key=True)
)


# Add relationship property to Node model
Node.patterns = relationship(
    "EmergentPattern",
    secondary="pattern_nodes",
    back_populates="nodes"
)


class FeedbackItem(Base):
    """Model for storing user feedback on detected relationships and patterns."""
    __tablename__ = "feedback_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    feedback_type = Column(String, nullable=False)  # confirmation, correction, suggestion
    entity_type = Column(String, nullable=False)  # relationship, pattern
    entity_id = Column(Integer, nullable=False)  # ID of the relationship or pattern
    feedback_value = Column(String, nullable=False)  # positive, negative, or specific value
    comments = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)

    # Relationship
    user = relationship("User", back_populates="feedback_items")


# Add relationship property to User model
User.feedback_items = relationship(
    "FeedbackItem",
    back_populates="user"
)


class ModelVersion(Base):
    """Model for tracking versions of the emergent model."""
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version = Column(String, nullable=False)
    trained_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, default=False)
    performance_metrics = Column(String)  # JSON-encoded metrics
    training_parameters = Column(String)  # JSON-encoded parameters
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False)