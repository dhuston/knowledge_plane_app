import uuid
from datetime import datetime
from typing import Any, Optional
from enum import Enum as PyEnum

from pydantic import BaseModel, Field, UUID4

# Enum for different types of knowledge assets
# Starting simple, will expand significantly
class KnowledgeAssetTypeEnum(str, PyEnum):
    NOTE = "note"
    DOCUMENT = "document" # Placeholder
    MESSAGE = "message"   # Placeholder
    MEETING = "meeting"   # Placeholder

# Shared properties
class KnowledgeAssetBase(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    type: KnowledgeAssetTypeEnum = Field(..., description="The type of knowledge asset")
    source: Optional[str] = Field(None, max_length=100, description="Origin (e.g., native, slack, drive)")
    link: Optional[str] = Field(None, description="External link if applicable")
    content: Optional[str] = None # For native notes or summaries
    project_id: Optional[UUID4] = Field(None, description="Link to the associated project")
    # user_id: Optional[UUID4] = None # Link to the creating/owning user
    properties: Optional[dict[str, Any]] = None

# Properties to receive via API on creation
class KnowledgeAssetCreate(KnowledgeAssetBase):
    type: KnowledgeAssetTypeEnum = KnowledgeAssetTypeEnum.NOTE # Default to note for now
    content: str # Require content for native notes
    project_id: UUID4 # Require project link for notes

# Properties to receive via API on update (e.g., updating a note)
class KnowledgeAssetUpdate(KnowledgeAssetBase):
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    type: Optional[KnowledgeAssetTypeEnum] = None # Should type be updatable?

# Properties shared by models stored in DB
class KnowledgeAssetInDBBase(KnowledgeAssetBase):
    id: UUID4 = Field(default_factory=uuid.uuid4)
    tenant_id: UUID4
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by_user_id: Optional[UUID4] = None # Track creator

    class Config:
        orm_mode = True

# Properties to return to client
class KnowledgeAsset(KnowledgeAssetInDBBase):
    pass

# Properties stored in DB
class KnowledgeAssetInDB(KnowledgeAssetInDBBase):
    pass 