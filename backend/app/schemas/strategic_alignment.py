from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from app.schemas.goal import Goal
from app.schemas.project import Project


class MisalignmentType(str, Enum):
    UNALIGNED_PROJECT = "unaligned_project"
    CONFLICTING_GOALS = "conflicting_goals"
    RESOURCE_MISALLOCATION = "resource_misallocation"
    STRATEGIC_GAP = "strategic_gap"
    DUPLICATED_EFFORT = "duplicated_effort"


class MisalignmentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Misalignment(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    type: MisalignmentType
    severity: MisalignmentSeverity
    description: str
    affected_entities: Dict[str, List[int]]  # e.g., {"projects": [1, 2], "goals": [3]}
    context: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class MisalignmentCreate(BaseModel):
    tenant_id: int
    type: MisalignmentType
    severity: MisalignmentSeverity
    description: str
    affected_entities: Dict[str, List[int]]
    context: Optional[Dict[str, Any]] = None


class MisalignmentUpdate(BaseModel):
    severity: Optional[MisalignmentSeverity] = None
    description: Optional[str] = None
    affected_entities: Optional[Dict[str, List[int]]] = None
    context: Optional[Dict[str, Any]] = None


class AlignmentMetrics(BaseModel):
    total_projects: int
    aligned_projects: int
    alignment_percentage: float
    misalignment_count_by_type: Dict[str, int]
    misalignment_count_by_severity: Dict[str, int]
    overall_alignment_score: float  # 0-100 score


class RecommendationType(str, Enum):
    GOAL_ALIGNMENT = "goal_alignment"
    PROJECT_RESTRUCTURING = "project_restructuring"
    TEAM_COLLABORATION = "team_collaboration"
    RESOURCE_REALLOCATION = "resource_reallocation"


class RecommendationDifficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Recommendation(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    type: RecommendationType
    title: str
    description: str
    difficulty: RecommendationDifficulty
    context: Optional[Dict[str, Any]] = None
    project_id: Optional[int] = None
    details: Dict[str, Any]
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class RecommendationCreate(BaseModel):
    tenant_id: int
    type: RecommendationType
    title: str
    description: str
    difficulty: RecommendationDifficulty
    context: Optional[Dict[str, Any]] = None
    project_id: Optional[int] = None
    details: Dict[str, Any]


class RecommendationFeedback(BaseModel):
    recommendation_id: int
    is_helpful: bool
    feedback_text: Optional[str] = None
    implemented: Optional[bool] = None


class ImpactSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ImpactTimeframe(str, Enum):
    IMMEDIATE = "immediate"
    SHORT_TERM = "short_term"  # Weeks
    MEDIUM_TERM = "medium_term"  # Months
    LONG_TERM = "long_term"  # Years


class ImpactAnalysis(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    name: str
    description: str
    severity: ImpactSeverity
    timeframe: ImpactTimeframe
    affected_entities: Dict[str, List[Dict[str, Any]]]
    metrics_impact: Dict[str, float]
    created_at: Optional[datetime] = None
    created_by_user_id: int
    
    class Config:
        orm_mode = True


class ImpactAnalysisCreate(BaseModel):
    tenant_id: int
    name: str
    description: str
    change_type: str  # E.g., "goal_change", "project_cancellation"
    change_details: Dict[str, Any]
    created_by_user_id: int


class ImpactScenario(BaseModel):
    id: Optional[int] = None
    tenant_id: int
    name: str
    description: str
    scenario_type: str  # E.g., "resource_reallocation", "goal_reprioritization"
    parameters: Dict[str, Any]
    created_by_user_id: int
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True


class ScenarioResult(BaseModel):
    id: Optional[int] = None
    scenario_id: int
    result_summary: Dict[str, Any]
    affected_entities: Dict[str, List[int]]
    metrics_before: Dict[str, float]
    metrics_after: Dict[str, float]
    recommendation: Optional[str] = None
    visualization_data: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True