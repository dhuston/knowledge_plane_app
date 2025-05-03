from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel


class MapNodeTypeEnum(str, Enum):
    USER = "user"
    TEAM = "team"
    PROJECT = "project"
    GOAL = "goal"
    DEPARTMENT = "department" # Assuming Department might be a node type
    KNOWLEDGE_ASSET = "knowledge_asset" # Generic asset type
    TEAM_CLUSTER = "team_cluster" # For clustered teams


class MapEdgeTypeEnum(str, Enum):
    REPORTS_TO = "REPORTS_TO"  # User -> User (Manager)
    MEMBER_OF = "MEMBER_OF"  # User -> Team, Team -> Department
    LEADS = "LEADS" # User -> Team/Department
    OWNS = "OWNS"  # User/Team -> Project, User -> KnowledgeAsset
    PARTICIPATES_IN = "PARTICIPATES_IN" # User -> Project (Placeholder)
    ALIGNED_TO = "ALIGNED_TO"  # Project -> Goal
    PARENT_OF = "PARENT_OF" # Goal -> Goal
    RELATED_TO = "RELATED_TO" # KnowledgeAsset -> Project/User etc.
    # Add more as needed


class MapNodePosition(BaseModel):
    """Detailed position information for map nodes"""
    x: float
    y: float
    z: Optional[float] = None  # For potential 3D visualization in future


class MapNode(BaseModel):
    id: str  # Using string ID for react-flow compatibility
    type: MapNodeTypeEnum
    label: str
    # Store raw entity data for the briefing panel
    data: Dict[str, Any] = {}
    # Position data with proper structure
    position: Optional[MapNodePosition] = None
    # Cluster information (if part of a visual cluster)
    cluster_id: Optional[str] = None


class MapEdge(BaseModel):
    id: str # e.g., f"{source_id}_{target_id}_{edge_type}"
    source: str # Source node ID (string)
    target: str # Target node ID (string)
    type: MapEdgeTypeEnum
    # Optional data like interaction strength, status, etc.
    data: Optional[Dict[str, Any]] = None
    # Optional styling hints
    animated: Optional[bool] = None
    label: Optional[str] = None


class PaginationMetadata(BaseModel):
    """Pagination information for map data queries"""
    has_more: bool = False
    next_cursor: Optional[str] = None
    total_count: Optional[int] = None
    page_number: Optional[int] = None
    page_size: Optional[int] = None


class MapData(BaseModel):
    """Map data response with nodes and edges, and optional pagination metadata"""
    nodes: List[MapNode]
    edges: List[MapEdge]
    pagination: Optional[PaginationMetadata] = None 