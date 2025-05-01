from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field


class RelationshipTypeEnum(str, Enum):
    TEAM_MEMBERSHIP = "team_membership"
    PROJECT_ASSIGNMENT = "project_assignment"
    REPORTING = "reporting"
    COLLABORATION = "collaboration"
    GOAL_ALIGNMENT = "goal_alignment"
    KNOWLEDGE_SHARING = "knowledge_sharing"


class RelationshipStrengthBase(BaseModel):
    source_id: int
    target_id: int
    relationship_type: RelationshipTypeEnum
    strength_value: float = Field(ge=0.0, le=1.0)
    confidence_score: float = Field(ge=0.0, le=1.0)
    relationship_metadata: Optional[Dict[str, Any]] = None


class RelationshipStrengthCreate(RelationshipStrengthBase):
    pass


class RelationshipStrengthUpdate(BaseModel):
    strength_value: Optional[float] = None
    confidence_score: Optional[float] = None
    relationship_metadata: Optional[Dict[str, Any]] = None


class RelationshipStrength(RelationshipStrengthBase):
    id: int
    last_updated: datetime
    tenant_id: int

    class Config:
        orm_mode = True


class EmergentPatternBase(BaseModel):
    pattern_type: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    description: Optional[str] = None
    pattern_metadata: Optional[Dict[str, Any]] = None
    is_validated: bool = False


class EmergentPatternCreate(EmergentPatternBase):
    node_ids: List[int]


class EmergentPatternUpdate(BaseModel):
    confidence_score: Optional[float] = None
    description: Optional[str] = None
    pattern_metadata: Optional[Dict[str, Any]] = None
    is_validated: Optional[bool] = None
    node_ids: Optional[List[int]] = None


class EmergentPattern(EmergentPatternBase):
    id: int
    detection_date: datetime
    tenant_id: int

    class Config:
        orm_mode = True


class EmergentPatternWithNodes(EmergentPattern):
    nodes: List[Dict[str, Any]]  # Simplified node representation


class FeedbackItemBase(BaseModel):
    user_id: int
    feedback_type: str  # confirmation, correction, suggestion
    entity_type: str  # relationship, pattern
    entity_id: int
    feedback_value: str  # positive, negative, or specific value
    comments: Optional[str] = None


class FeedbackItemCreate(FeedbackItemBase):
    pass


class FeedbackItem(FeedbackItemBase):
    id: int
    created_at: datetime
    tenant_id: int

    class Config:
        orm_mode = True


class ModelVersionBase(BaseModel):
    version: str
    is_active: bool = False
    performance_metrics: Optional[Dict[str, Any]] = None
    training_parameters: Optional[Dict[str, Any]] = None


class ModelVersionCreate(ModelVersionBase):
    pass


class ModelVersionUpdate(BaseModel):
    is_active: Optional[bool] = None
    performance_metrics: Optional[Dict[str, Any]] = None


class ModelVersion(ModelVersionBase):
    id: int
    trained_at: datetime
    tenant_id: int

    class Config:
        orm_mode = True


class ClusterMetadata(BaseModel):
    """Metadata about a cluster."""
    created_at: str
    algorithm: str
    strength_threshold: float
    additional_info: Optional[Dict[str, Any]] = None


class Cluster(BaseModel):
    """Representation of an entity cluster."""
    id: str
    name: str
    node_type: str
    members: List[int]
    size: int
    central_members: List[int]
    metadata: ClusterMetadata


class CrossClusterRelationship(BaseModel):
    """Representation of a relationship between two clusters."""
    source_cluster_id: str
    target_cluster_id: str
    strength: float
    relationship_count: int