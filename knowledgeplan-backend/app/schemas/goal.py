import uuid
from datetime import datetime, date
from typing import Any, Optional
from enum import Enum as PyEnum
from uuid import UUID

from pydantic import BaseModel, Field, UUID4

class GoalTypeEnum(str, PyEnum):
    ENTERPRISE = "enterprise"
    DEPARTMENT = "department"
    TEAM = "team"
    INDIVIDUAL = "individual" # Maybe add later

# Shared properties
class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = None # Consider Enum later: Enterprise/Dept/Team
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    dueDate: Optional[date] = Field(None, alias='dueDate') # Match frontend if needed
    parent_id: Optional[UUID] = None
    # properties: Optional[dict] = {} # Replaced with JSON type below

    class Config:
        allow_population_by_field_name = True # Allow using dueDate alias

# Properties to receive via API on creation
class GoalCreate(GoalBase):
    pass # Inherits all from GoalBase for now

# Properties to receive via API on update
class GoalUpdate(GoalBase):
    # Make all fields optional for update
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = Field(None, ge=0, le=100)
    dueDate: Optional[date] = Field(None, alias='dueDate')
    parent_id: Optional[UUID] = None
    # properties: Optional[dict] = None

# Properties shared by models stored in DB
class GoalInDBBase(GoalBase):
    id: UUID
    tenant_id: UUID
    created_at: datetime
    updated_at: datetime
    # properties: Optional[Any] = None # Use JSON type from SQLAlchemy

    # Use Pydantic V2 config
    model_config = {
        "from_attributes": True,
        "populate_by_name": True, # Replaces allow_population_by_field_name
    }

# Properties to return to client
class GoalRead(GoalInDBBase):
    pass # Inherits all needed fields

# Minimal Goal details (e.g., for lists where properties are excluded)
class GoalReadMinimal(BaseModel):
    # Match the columns selected in the specific query
    id: UUID
    tenant_id: UUID
    title: str
    description: Optional[str] = None
    type: GoalTypeEnum
    parent_id: Optional[UUID] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    due_date: Optional[date] = None
    # Exclude properties
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Properties stored in DB
class GoalInDB(GoalInDBBase):
    pass 