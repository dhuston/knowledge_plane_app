import uuid
from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import Optional
from datetime import datetime

# Shared properties
class TeamBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

# Properties to receive on team creation
class TeamCreate(TeamBase):
    name: str
    tenant_id: uuid.UUID # Required when creating

# Properties to receive on team update
class TeamUpdate(TeamBase):
    pass

# Properties shared by models stored in DB
class TeamInDBBase(TeamBase):
    id: uuid.UUID
    name: str
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Pydantic V2

# Properties to return to client
class Team(TeamInDBBase):
    pass

# Properties stored in DB
class TeamInDB(TeamInDBBase):
    pass 