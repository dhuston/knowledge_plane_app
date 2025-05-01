from pydantic import BaseModel
from typing import List, Dict
import uuid

class ProjectOverlapResponse(BaseModel):
    overlaps: Dict[uuid.UUID, List[uuid.UUID]] 