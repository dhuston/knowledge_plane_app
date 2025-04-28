import logging # Import logging
from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router as api_v1_router

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

# --- Add Middlewares --- #

# Add CORS Middleware FIRST to handle preflight requests earliest
origins = [
    "*", # TEMPORARILY allow all origins for debugging
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True, 
    allow_methods=["*"],    
    allow_headers=["*"], # Change this to allow all headers
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

# Add CORSMiddleware if needed later (for frontend interaction)
# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"] # Configure allowed origins properly
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# ) 