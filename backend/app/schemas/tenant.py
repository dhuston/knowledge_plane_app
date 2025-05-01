import uuid
from pydantic import BaseModel, EmailStr, HttpUrl, Field
from typing import Optional
from datetime import datetime

# Shared properties
class TenantBase(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    sso_config: Optional[dict] = None

# Properties to receive on tenant creation
class TenantCreate(TenantBase):
    name: str
    domain: Optional[str] = None # Make domain optional on creation? Or infer?

# Properties to receive on tenant update
class TenantUpdate(TenantBase):
    pass

# Properties shared by models stored in DB
class TenantInDBBase(TenantBase):
    id: uuid.UUID
    name: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Pydantic V2 uses this instead of orm_mode

# Properties to return to client
class TenantRead(TenantInDBBase):
    pass

# Properties stored in DB
class TenantInDB(TenantInDBBase):
    pass 