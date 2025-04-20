from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    sub: Optional[UUID] = None # Subject (user ID)
    # Add other relevant payload fields like tenant_id, roles etc.
    tenant_id: Optional[UUID] = None 