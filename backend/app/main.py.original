import logging
from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import time

from app.core.config import settings
from app.core.tenant_context import configure_tenant_middleware
from app.core.tenant_filter import register_tenant_events
from app.core.security import initialize_oauth
from app.core.entity_event_hooks import register_entity_event_hooks

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Set up debug logging for key components
logging.getLogger('app.api.v1.endpoints.map').setLevel(logging.DEBUG)
logging.getLogger('app.crud.crud_node').setLevel(logging.DEBUG)
logging.getLogger('app.crud.crud_edge').setLevel(logging.DEBUG)

# Import API Routers
from app.api.routers import auth as auth_router
from app.api.routers import users as users_router
from app.api.routers import teams as teams_router
from app.api.routers import integrations as integrations_router
from app.api.routers import projects as projects_router
from app.api.routers import goals as goals_router
from app.api.routers import briefings as briefings_router
from app.api.routers import insights as insights_router
from app.api.routers import notes as notes_router
from app.api.routers import stream as stream_router
from app.api.routers import admin as admin_router
from app.api.routers import notifications as notifications_router
from app.api.v1.endpoints import map as map_router

# Create the FastAPI app
app = FastAPI(
    title="KnowledgePlane AI API",
    openapi_url="/api/v1/openapi.json"
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting application initialization")
    await initialize_oauth()
    logger.info("Application initialization complete")

# Configure middleware
configure_tenant_middleware(app)
register_tenant_events()
register_entity_event_hooks()

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000"
    ],  
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Add request logging middleware
@app.middleware("http")
async def log_request_details_middleware(request: Request, call_next):
    path = request.url.path
    query = request.url.query
    method = request.method
    client = request.client.host if request.client else "unknown"
    
    if "/notifications" in path:
        logger.warning(f"NOTIFICATION REQUEST: {method} {path}?{query} - From: {client}")
    else:
        logger.info(f"REQUEST: {method} {path}?{query} - From: {client}")
    
    try:
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        
        if "/notifications" in path:
            logger.warning(f"NOTIFICATION RESPONSE: {method} {path} - Status: {response.status_code} - Time: {process_time:.4f}s")
        else:
            logger.info(f"RESPONSE: {method} {path} - Status: {response.status_code} - Time: {process_time:.4f}s")
        
        if response.status_code == 404:
            if "/notifications" in path:
                logger.error(f"404 NOT FOUND FOR NOTIFICATION ENDPOINT: {method} {path}")
            else:
                logger.warning(f"404 NOT FOUND: {method} {path}")
            
        return response
    except Exception as e:
        logger.error(f"REQUEST ERROR: {method} {path} - {str(e)}")
        raise

# Add Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

# Define API routes
api_prefix = "/api/v1"

# Register the API routers
app.include_router(map_router.router, prefix=f"{api_prefix}/map", tags=["map"])
app.include_router(auth_router.router, prefix=f"{api_prefix}/auth", tags=["auth"])
app.include_router(users_router.router, prefix=f"{api_prefix}/users", tags=["users"])
app.include_router(teams_router.router, prefix=f"{api_prefix}/teams", tags=["teams"])
app.include_router(integrations_router.router, prefix=f"{api_prefix}/integrations", tags=["integrations"])
app.include_router(projects_router.router, prefix=f"{api_prefix}/projects", tags=["projects"])
app.include_router(goals_router.router, prefix=f"{api_prefix}/goals", tags=["goals"])
app.include_router(briefings_router.router, prefix=f"{api_prefix}/briefings", tags=["briefings"])
app.include_router(insights_router.router, prefix=f"{api_prefix}/insights", tags=["insights"])
app.include_router(notes_router.router, prefix=f"{api_prefix}/notes", tags=["notes"])
app.include_router(stream_router.router, prefix=f"{api_prefix}", tags=["stream"])
app.include_router(admin_router.router, prefix=f"{api_prefix}/admin", tags=["admin"])
app.include_router(notifications_router.router, prefix=f"{api_prefix}/notifications", tags=["notifications"])

# Root endpoint
@app.get("/")
async def root():
    return {"message": "KnowledgePlane AI API is running"}