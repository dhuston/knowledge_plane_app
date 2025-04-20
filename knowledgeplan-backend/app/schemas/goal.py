import uuid
from datetime import datetime, date
from typing import Any, Optional
from enum import Enum as PyEnum

from pydantic import BaseModel, Field, UUID4

class GoalTypeEnum(str, PyEnum):
    ENTERPRISE = "enterprise"
    DEPARTMENT = "department"
    TEAM = "team"
    INDIVIDUAL = "individual" # Maybe add later

# Shared properties
class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    type: GoalTypeEnum = Field(..., description="The level this goal applies to")
    parent_id: Optional[UUID4] = Field(None, description="Link to parent goal for hierarchy")
    status: Optional[str] = Field(default="on_track", max_length=50)
    progress: Optional[int] = Field(default=0, ge=0, le=100)
    due_date: Optional[date] = None
    properties: Optional[dict[str, Any]] = None

# Properties to receive via API on creation
class GoalCreate(GoalBase):
    pass

# Properties to receive via API on update
class GoalUpdate(GoalBase):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[GoalTypeEnum] = None

# Properties shared by models stored in DB
class GoalInDBBase(GoalBase):
    id: UUID4 = Field(default_factory=uuid.uuid4)
    tenant_id: UUID4
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        orm_mode = True

# Properties to return to client
# We might want to include children or related projects here later
class Goal(GoalInDBBase):
    pass

# Properties stored in DB
class GoalInDB(GoalInDBBase):
    pass 