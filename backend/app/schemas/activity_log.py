import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

# Shared properties
class ActivityLogBase(BaseModel):
    action: str
    target_entity_type: Optional[str] = None
    target_entity_id: Optional[str] = None
    details: Optional[dict[str, Any]] = None

# Properties to receive via API on creation (Internal use mostly)
class ActivityLogCreate(ActivityLogBase):
    tenant_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None

# Properties to return to client
class ActivityLogRead(ActivityLogBase):
    id: uuid.UUID
    tenant_id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    timestamp: datetime

    model_config = {"from_attributes": True} 