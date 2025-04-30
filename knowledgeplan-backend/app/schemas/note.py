import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, UUID4

# Schema for basic user info to embed in NoteRead
class UserReadMinimal(BaseModel):
    id: UUID4
    name: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

# Shared properties
class NoteBase(BaseModel):
    title: Optional[str] = None
    content: str

# Properties to receive via API on creation
class NoteCreate(NoteBase):
    project_id: UUID4
    # author_id will be taken from current_user

# Properties to receive via API on update
class NoteUpdate(NoteBase):
    title: Optional[str] = None # Allow updating title
    content: Optional[str] = None # Allow updating content

# Properties shared by models stored in DB
class NoteInDBBase(NoteBase):
    id: UUID4
    tenant_id: UUID4
    project_id: UUID4
    author_id: UUID4
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
    }

# Properties to return to client
class NoteRead(NoteInDBBase):
    author: Optional[UserReadMinimal] = None # Embed minimal author info

# Properties stored in DB
class NoteInDB(NoteInDBBase):
    pass

# Schema specifically for listing recent notes (only title and id maybe?)
class NoteReadRecent(BaseModel):
    id: UUID4
    title: Optional[str] = None
    created_at: datetime

    model_config = {
        "from_attributes": True,
    } 