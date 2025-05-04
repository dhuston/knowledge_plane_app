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

# Configure logging - simple, clean configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import API router
from app.api.v1.api import api_router

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

# Simple request logging middleware - no special case handling
@app.middleware("http")
async def log_request_middleware(request: Request, call_next):
    path = request.url.path
    method = request.method
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    log_message = f"{method} {path} - Status: {response.status_code} - Time: {process_time:.4f}s"
    
    if response.status_code >= 500:
        logger.error(log_message)
    elif response.status_code >= 400:
        logger.warning(log_message)
    else:
        logger.info(log_message)
    
    return response

# Add Session Middleware
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY,
)

# Register the API router
app.include_router(api_router, prefix="/api/v1")

# Root endpoint
@app.get("/")
async def root():
    return {"message": "KnowledgePlane AI API is running"}