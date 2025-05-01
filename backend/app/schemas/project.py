import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, UUID4

# Shared properties
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = Field(default="active", max_length=50)
    owning_team_id: Optional[UUID4] = None
    # goal_id: Optional[UUID4] = None # Uncomment when Goal model exists
    properties: Optional[dict[str, Any]] = None

# Properties to receive via API on creation
class ProjectCreate(ProjectBase):
    pass

# Properties to receive via API on update
class ProjectUpdate(ProjectBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[str] = Field(None, max_length=50)

# Properties shared by models stored in DB
class ProjectInDBBase(ProjectBase):
    id: UUID4 = Field(default_factory=uuid.uuid4)
    tenant_id: UUID4
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    # goal_id: Optional[UUID4] = None # Match base

    # Use Pydantic V2 config
    model_config = {
        "from_attributes": True,
    }

# Properties to return to client
class ProjectRead(ProjectInDBBase):
    pass

# Properties stored in DB
class ProjectInDB(ProjectInDBBase):
    pass 