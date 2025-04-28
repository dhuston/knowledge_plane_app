import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, UUID4

# Shared properties
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

# Properties to receive via API on creation
class DepartmentCreate(DepartmentBase):
    pass

# Properties to receive via API on update
class DepartmentUpdate(DepartmentBase):
    name: Optional[str] = Field(None, min_length=1, max_length=255)

# Properties shared by models stored in DB
class DepartmentInDBBase(DepartmentBase):
    id: UUID4
    tenant_id: UUID4
    created_at: datetime
    updated_at: datetime

    # Pydantic V2 configuration
    model_config = {
        "from_attributes": True,
    }

# Properties to return to client
class DepartmentRead(DepartmentInDBBase):
    pass # Add relationships later if needed, e.g., List[TeamRead]

# Properties stored in DB
class DepartmentInDB(DepartmentInDBBase):
    pass 