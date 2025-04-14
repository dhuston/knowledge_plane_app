from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
from uuid import UUID

from jose import jwt
from passlib.context import CryptContext
from authlib.integrations.starlette_client import OAuth
from app.core.config import settings
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, UUID4
from sqlalchemy.ext.asyncio import AsyncSession

# Import DB session and user CRUD/model
from app.db.session import get_db_session
from app.crud.crud_user import user as crud_user
from app.models.user import User as UserModel

# Password hashing context (if using password auth later)
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configure Authlib OAuth client
oauth = OAuth()

# Register Google OAuth client
# Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in your .env
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile https://www.googleapis.com/auth/calendar.events.readonly'
        # Add other necessary scopes
    }
)

ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
SECRET_KEY = settings.SECRET_KEY

# Define the OAuth2 scheme
# The tokenUrl should point to where a user would theoretically get a token
# (e.g., a password login endpoint, which we don't have yet for JWT directly).
# For now, we get tokens via Google OAuth callback.
# The /api/v1 prefix comes from main.py where the router is included.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token") # Placeholder URL

# Pydantic model for data stored in the JWT token
class TokenData(BaseModel):
    sub: Optional[UUID4] = None

def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """Creates a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(
    db: AsyncSession = Depends(get_db_session),
    token: str = Depends(oauth2_scheme)
) -> UserModel:
    """Dependency to verify JWT and return the current user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id_str: Optional[str] = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise credentials_exception
        token_data = TokenData(sub=user_id)
    except JWTError as e:
        raise credentials_exception
        
    user = await crud_user.get(db, id=token_data.sub)
    if user is None:
        raise credentials_exception
    
    return user

# Optional: Dependency for getting current active user (add is_active field to model later)
# async def get_current_active_user(current_user: UserModel = Depends(get_current_user)) -> UserModel:
#     if not current_user.is_active:
#         raise HTTPException(status_code=400, detail="Inactive user")
#     return current_user

# JWT functions will go here later (BE-TASK-013)
# def create_access_token(...): ...
# def verify_token(...): ... 