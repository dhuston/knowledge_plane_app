import uuid
from datetime import datetime
from typing import Any, Optional, Dict
from enum import Enum as PyEnum
from uuid import UUID

from pydantic import BaseModel, Field, UUID4, computed_field

# Import a basic User schema for relationship
from .user import UserReadBasic # Assuming you have a basic UserRead schema

# Enum for different types of knowledge assets
# Starting simple, will expand significantly
class KnowledgeAssetTypeEnum(str, PyEnum):
    NOTE = "NOTE"
    DOCUMENT = "DOCUMENT"
    MESSAGE = "MESSAGE"
    MEETING = "MEETING"
    REPORT = "REPORT"
    SUBMISSION = "SUBMISSION"
    PRESENTATION = "PRESENTATION"
    # Add more types as needed

# --- Schemas specific to NOTE type --- 

class NoteBase(BaseModel):
    content: str = Field(..., description="The main text content of the note.")
    # Optional fields that might apply to notes
    title: Optional[str] = Field(None, description="Optional title for the note.")
    properties: Optional[Dict[str, Any]] = Field(None, description="Flexible key-value pairs for additional metadata.")

class NoteCreate(NoteBase):
    # Although derived from context/URL, make it explicit for clarity if needed
    project_id: Optional[UUID] = None # Make optional if backend derives it
    # owner_id will be derived from the current user
    # type will likely be set automatically to NOTE
    # Pass only content usually, let backend handle links?
    pass # Keep inheriting for now, backend uses content + context

class NoteRead(NoteBase):
    id: UUID
    tenant_id: UUID
    project_id: UUID # Link back to the project
    # owner_id: UUID # Remove direct field, use computed field instead
    type: KnowledgeAssetTypeEnum = KnowledgeAssetTypeEnum.NOTE # Explicitly show type
    created_at: datetime
    updated_at: datetime
    
    # Add relationship field (needs to match model attribute name after loading)
    # Assuming selectinload loads into 'created_by' attribute based on model
    created_by: Optional[UserReadBasic] = None 

    @computed_field
    @property
    def owner_id(self) -> Optional[UUID]:
        return self.created_by.id if self.created_by else None

    # Pydantic V2 configuration
    model_config = {
        "from_attributes": True,
    }

# --- Generic Knowledge Asset Schemas (Can be used if needed) --- 

# Shared properties for any Knowledge Asset
class KnowledgeAssetBase(BaseModel):
    type: KnowledgeAssetTypeEnum
    title: Optional[str] = None
    source: Optional[str] = None # e.g., Drive, Slack, Native
    link: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None

# Properties to receive on creation (Generic - might need specific ones like NoteCreate)
class KnowledgeAssetCreate(KnowledgeAssetBase):
    project_id: Optional[UUID] = None # Asset might be linked to a project
    # Add other potential links like goal_id, user_id?

# Properties to receive on update
class KnowledgeAssetUpdate(KnowledgeAssetBase):
    type: Optional[KnowledgeAssetTypeEnum] = None # Usually type shouldn't change
    title: Optional[str] = None
    source: Optional[str] = None
    link: Optional[str] = None
    properties: Optional[Dict[str, Any]] = None
    # Should not allow updating project_id or owner_id easily

# Properties to return to client (Generic)
class KnowledgeAssetRead(KnowledgeAssetBase):
    id: UUID
    tenant_id: UUID
    project_id: Optional[UUID] = None
    owner_id: UUID # Who created/owns this asset
    created_at: datetime
    updated_at: datetime

    # Pydantic V2 configuration
    model_config = {
        "from_attributes": True,
    }

# Properties shared by models stored in DB
class KnowledgeAssetInDBBase(KnowledgeAssetBase):
    id: UUID4 = Field(default_factory=uuid.uuid4)
    tenant_id: UUID4
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by_user_id: Optional[UUID4] = None # Track creator

    # Pydantic V2 configuration
    model_config = {
        "from_attributes": True,
    }

# Properties to return to client
class KnowledgeAsset(KnowledgeAssetInDBBase):
    pass

# Properties stored in DB
class KnowledgeAssetInDB(KnowledgeAssetInDBBase):
    pass 