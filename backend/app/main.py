import logging # Import logging
from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.core.config import settings
from app.api.v1.api import api_router as api_v1_router
from app.core.tenant_context import configure_tenant_middleware
from app.core.tenant_filter import register_tenant_events
from app.core.security import initialize_oauth

# Import API Routers
from app.api.routers import auth as auth_router
from app.api.routers import users as users_router
from app.api.routers import teams as teams_router # Assuming this exists from Slice 1
from app.api.routers import integrations as integrations_router # Assuming this exists
from app.api.routers import map as map_router # New map router
from app.api.routers import projects as projects_router # Import the new projects router
from app.api.routers import goals as goals_router # Import goals router
from app.api.routers import briefings as briefings_router
from app.api.routers import insights as insights_router
from app.api.routers import notes as notes_router
from app.api.routers import stream as stream_router

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# --- Temporary Header Logging Middleware ---
# async def log_headers_middleware(request: Request, call_next):
#     ...
# ----------------------------------------

app = FastAPI(
    title="KnowledgePlane AI API",
    # openapi_url=f"{settings.API_V1_STR}/openapi.json" # Example if using settings
    openapi_url="/api/v1/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    """Initialize services on application startup."""
    logger.info("Starting application initialization")
    
    # Initialize OAuth providers
    await initialize_oauth()
    
    logger.info("Application initialization complete")

# --- Add Middlewares --- #

# Configure tenant middleware (must be added before other middlewares that need tenant context)
configure_tenant_middleware(app)

# Register tenant filter events for SQLAlchemy
register_tenant_events()

# Add CORS Middleware to handle preflight requests earliest
# For development, we'll allow all origins since we're having CORS issues
from fastapi.middleware.cors import CORSMiddleware

# Add CORS middleware with a wildcard origin for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=False,  # Must be False when using wildcard origin
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

# Add the temporary logging middleware FIRST (COMMENTED OUT)
# app.middleware("http")(log_headers_middleware)

# Add Session Middleware 
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY, 
    # Configure session cookie parameters as needed (e.g., max_age, https_only)
    # max_age=14 * 24 * 60 * 60,  # Example: 14 days
    # https_only=True, # Recommended for production
)

# Include API Routers
# Prefix common path for all routes under this router
api_prefix = "/api/v1"

app.include_router(auth_router.router, prefix=f"{api_prefix}/auth", tags=["auth"])
app.include_router(users_router.router, prefix=f"{api_prefix}/users", tags=["users"])
app.include_router(teams_router.router, prefix=f"{api_prefix}/teams", tags=["teams"])
app.include_router(integrations_router.router, prefix=f"{api_prefix}/integrations", tags=["integrations"])
app.include_router(map_router.router, prefix=f"{api_prefix}/map", tags=["map"]) # Include the map router
app.include_router(projects_router.router, prefix=f"{api_prefix}/projects", tags=["projects"]) # Register projects router
app.include_router(goals_router.router, prefix=f"{api_prefix}/goals", tags=["goals"]) # Register goals router
app.include_router(briefings_router.router, prefix=f"{api_prefix}/briefings", tags=["briefings"])
app.include_router(insights_router.router, prefix=f"{api_prefix}/insights", tags=["insights"])
app.include_router(notes_router.router, prefix=f"{api_prefix}/notes", tags=["notes"])
app.include_router(stream_router.router, prefix=f"{api_prefix}", tags=["stream"])

# Add root endpoint or additional setup if needed
@app.get("/")
async def root():
    logger.info("Root endpoint / accessed.") # Add logging here too
    return {"message": "KnowledgePlane AI API is running"}
    
@app.get("/api/v1/health/cors-test")
async def cors_test():
    """Test endpoint for CORS configuration"""
    logger.info("CORS test endpoint accessed")
    
    # Create a response with explicit CORS headers
    response = JSONResponse({"status": "ok", "cors": "enabled"})
    
    # Add explicit CORS headers for debugging
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    
    return response
    
@app.options("/api/v1/auth/dev-login")
@app.get("/api/v1/auth/dev-login")
async def dev_login(request: Request):
    """Development-only endpoint that returns mock tokens directly without OAuth redirect"""
    logger.info("Development login endpoint accessed")
    
    # Only allow in development mode
    if not getattr(settings, "DISABLE_OAUTH", False):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
        
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        response = JSONResponse({})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        return response
        
    # Generate mock tokens
    from app.core.security import create_access_token
    from uuid import UUID
    import json
    from datetime import timedelta
    
    # Create mock IDs
    mock_user_id = "11111111-1111-1111-1111-111111111111"
    mock_tenant_id = "33333333-3333-3333-3333-333333333333"
    
    # Create tokens with tenant_id
    access_token = create_access_token(
        subject=mock_user_id, 
        tenant_id=mock_tenant_id
    )
    refresh_token = create_access_token(
        subject=mock_user_id,
        tenant_id=mock_tenant_id,
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    # Create the response with tokens
    response = JSONResponse({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    })
    
    # Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    
    return response
    
@app.options("/api/v1/users/mock-me", status_code=200)
async def options_mock_me():
    """Handle OPTIONS requests for the mock-me endpoint"""
    response = JSONResponse({})
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response

@app.get("/api/v1/users/mock-me")
async def mock_me(request: Request):
    """Development-only endpoint that returns mock user data directly, bypassing Pydantic validation"""
    logger.info("Mock /users/me endpoint accessed")
    
    # Only allow in development mode
    if not getattr(settings, "DISABLE_OAUTH", False):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    # Get the authorization header
    auth_header = request.headers.get('Authorization')
    
    # Check if authorization header exists and is valid
    if not auth_header or not auth_header.startswith('Bearer '):
        response = JSONResponse({"detail": "Not authenticated"}, status_code=401)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        return response
        
    # Extract the token
    token = auth_header.split(' ')[1]
    
    try:
        # Validate the token
        from app.core.security import jwt, settings, ALGORITHM
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        
        # Create a response with mock user data - don't use UUID objects since we're bypassing validation
        # Use a format that should work with the frontend directly
        mock_user = {
            "id": "11111111-1111-1111-1111-111111111111",
            "email": "dev@example.com",
            "name": "Development User",
            "title": "Software Developer", 
            "avatar_url": None,
            "online_status": True,
            "team_id": "22222222-2222-2222-2222-222222222222",
            "manager_id": None,
            "tenant_id": "33333333-3333-3333-3333-333333333333",
            "created_at": "2025-05-01T00:00:00Z",
            "updated_at": "2025-05-01T00:00:00Z"
        }
        
        response = JSONResponse(mock_user)
        
    except Exception as e:
        logger.error(f"Token validation error: {e}")
        response = JSONResponse({"detail": "Invalid or expired token"}, status_code=401)
    
    # Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    
    return response