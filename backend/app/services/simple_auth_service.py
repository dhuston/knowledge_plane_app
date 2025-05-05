from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from uuid import UUID
from jose import jwt, JWTError

from app.core.config import settings
from app.models.user import User
from app.db.session import AsyncSession


class SimpleAuthService:
    """Simplified authentication service for handling JWT operations and user authentication."""
    
    def __init__(self, secret_key: str, algorithm: str, token_expire_minutes: int = 60):
        self.secret_key = secret_key
        self.algorithm = algorithm
        self.token_expire_minutes = token_expire_minutes
    
    def create_token(self, user_id: UUID, tenant_id: Optional[UUID] = None) -> str:
        """
        Create a JWT token for a user.
        
        Args:
            user_id: User ID to include in the token
            tenant_id: Optional tenant ID to include in the token
            
        Returns:
            str: Encoded JWT token
        """
        expires = datetime.utcnow() + timedelta(minutes=self.token_expire_minutes)
        
        # Create payload with required claims
        payload = {
            "sub": str(user_id),
            "exp": expires
        }
        
        # Add tenant ID if provided
        if tenant_id:
            payload["tenant_id"] = str(tenant_id)
            
        # Encode and return the token
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def validate_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate a JWT token and return its payload.
        
        Args:
            token: JWT token to validate
            
        Returns:
            Optional[Dict[str, Any]]: Token payload if valid, None otherwise
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except JWTError:
            return None
    
    async def authenticate_user(
        self, 
        db: AsyncSession,
        email: str, 
        password: str
    ) -> Tuple[bool, Optional[User]]:
        """
        Authenticate a user with email and password.
        
        Args:
            db: Database session
            email: User email
            password: User password
            
        Returns:
            Tuple[bool, Optional[User]]: (Success flag, User if successful)
        """
        from app.crud.crud_user import user as crud_user
        
        # Get user by email
        user = await crud_user.get_by_email(db, email=email)
        if not user:
            return False, None
        
        # Verify password
        from app.core.security import pwd_context
        if not pwd_context.verify(password, user.hashed_password):
            return False, None
            
        return True, user
    
    async def get_user_from_token(
        self, 
        db: AsyncSession,
        token: str
    ) -> Tuple[bool, Optional[User], Optional[str]]:
        """
        Get a user from a token.
        
        Args:
            db: Database session
            token: JWT token
            
        Returns:
            Tuple[bool, Optional[User], Optional[str]]: 
                (Success flag, User if successful, Error message if unsuccessful)
        """
        from app.crud.crud_user import user as crud_user
        
        # Validate token
        payload = self.validate_token(token)
        if not payload:
            return False, None, "Invalid token"
        
        # Extract user ID
        user_id_str = payload.get("sub")
        if not user_id_str:
            return False, None, "User ID not found in token"
            
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            return False, None, "Invalid user ID format"
        
        # Get user from database
        user = await crud_user.get(db, id=user_id)
        if not user:
            return False, None, "User not found"
            
        # Validate tenant if present in token
        tenant_id_str = payload.get("tenant_id")
        if tenant_id_str:
            try:
                token_tenant_id = UUID(tenant_id_str)
                if user.tenant_id != token_tenant_id:
                    # In production, this would be an error
                    # For development/demo, we'll allow it but warn
                    if settings.DEBUG:
                        return True, user, "Tenant mismatch (allowed in DEBUG mode)"
                    else:
                        return False, None, "User tenant does not match token tenant"
            except ValueError:
                return False, None, "Invalid tenant ID format"
                
        return True, user, None


# Create a global instance using settings
simple_auth_service = SimpleAuthService(
    secret_key=settings.SECRET_KEY,
    algorithm=settings.ALGORITHM,
    token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
)