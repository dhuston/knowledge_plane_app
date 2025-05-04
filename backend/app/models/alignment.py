from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from typing import Dict, List, Any

from app.db.base_class import Base


class Misalignment(Base):
    """
    Stores detected misalignments between organizational entities.
    
    Misalignments can include unaligned projects (projects with no associated goals),
    conflicting goals, resource misallocations, etc.
    """
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant.id"), index=True, nullable=False)
    type = Column(String, nullable=False)  # Using String for flexibility
    severity = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    affected_entities = Column(JSON, nullable=False)  # {"projects": [1, 2], "goals": [3]}
    context = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")


class Recommendation(Base):
    """
    Stores recommendations for improving organizational alignment.
    
    Recommendations can include goal alignment suggestions, project restructuring,
    team collaboration opportunities, and resource reallocation suggestions.
    """
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant.id"), index=True, nullable=False)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String, nullable=False)
    context = Column(JSON, nullable=True)
    
    # Optional relationship to a specific project
    project_id = Column(Integer, ForeignKey("project.id"), nullable=True, index=True)
    
    # Store detailed recommendation data as JSON
    details = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    tenant = relationship("Tenant")
    project = relationship("Project", foreign_keys=[project_id])
    feedback = relationship("RecommendationFeedback", back_populates="recommendation", cascade="all, delete-orphan")


class RecommendationFeedback(Base):
    """
    Stores user feedback on recommendations.
    """
    id = Column(Integer, primary_key=True, index=True)
    recommendation_id = Column(Integer, ForeignKey("recommendation.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), index=True, nullable=False)
    is_helpful = Column(Boolean, nullable=False)
    feedback_text = Column(Text, nullable=True)
    implemented = Column(Boolean, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    recommendation = relationship("Recommendation", back_populates="feedback")
    user = relationship("User")


class ImpactAnalysis(Base):
    """
    Stores impact analysis results for organizational changes.
    
    Impact analysis assesses how changes to goals, projects, or resources
    would affect organizational alignment and performance.
    """
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    
    # Store affected entities and metrics impact as JSON
    affected_entities = Column(JSON, nullable=False)
    metrics_impact = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by = relationship("User")


class ImpactScenario(Base):
    """
    Stores what-if scenarios for strategic decision analysis.
    """
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenant.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    scenario_type = Column(String, nullable=False)
    parameters = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by_user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Relationships
    tenant = relationship("Tenant")
    created_by = relationship("User")
    results = relationship("ScenarioResult", back_populates="scenario", cascade="all, delete-orphan")


class ScenarioResult(Base):
    """
    Stores the results of impact scenario simulations.
    """
    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(Integer, ForeignKey("impact_scenario.id"), index=True, nullable=False)
    result_summary = Column(JSON, nullable=False)
    affected_entities = Column(JSON, nullable=False)
    metrics_before = Column(JSON, nullable=False)
    metrics_after = Column(JSON, nullable=False)
    recommendation = Column(Text, nullable=True)
    visualization_data = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    scenario = relationship("ImpactScenario", back_populates="results")