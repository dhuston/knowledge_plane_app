from typing import List, Dict, Any, Optional
from enum import Enum as PyEnum
from uuid import UUID

from pydantic import BaseModel, Field

# Define possible node types - can be extended
class MapNodeTypeEnum(str, PyEnum):
    USER = "user"
    TEAM = "team"
    PROJECT = "project"
    GOAL = "goal"
    KNOWLEDGE_ASSET = "knowledge_asset"
    DEPARTMENT = "department" # Example future type

# Define possible edge types - can be extended
class MapEdgeTypeEnum(str, PyEnum):
    REPORTS_TO = "reports_to"
    MEMBER_OF = "member_of"
    LEADS = "leads"
    OWNS = "owns"
    PARTICIPATES_IN = "participates_in"
    ALIGNED_TO = "aligned_to"
    DEPENDS_ON = "depends_on" # Example future type
    LINKS_TO = "links_to"     # Example future type

class MapNode(BaseModel):
    id: str = Field(..., description="Unique ID for the node (string representation of UUID or composite key)")
    type: MapNodeTypeEnum = Field(..., description="Type of the entity this node represents")
    label: str = Field(..., description="Display name for the node")
    data: Dict[str, Any] = Field(default_factory=dict, description="Payload containing additional properties for styling or context panels")
    # Position hint - backend might not set this initially
    position: Optional[Dict[str, float]] = Field(None, description="Optional position hint for frontend layout {x, y}")

class MapEdge(BaseModel):
    id: str = Field(..., description="Unique ID for the edge (e.g., sourceId_type_targetId)")
    source: str = Field(..., description="ID of the source MapNode")
    target: str = Field(..., description="ID of the target MapNode")
    type: MapEdgeTypeEnum = Field(..., description="Type of relationship this edge represents")
    label: Optional[str] = Field(None, description="Optional display label for the edge")
    data: Dict[str, Any] = Field(default_factory=dict, description="Payload containing additional properties for the edge")

class MapData(BaseModel):
    nodes: List[MapNode] = Field(default_factory=list)
    edges: List[MapEdge] = Field(default_factory=list) 