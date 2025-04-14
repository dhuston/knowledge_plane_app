from fastapi import FastAPI, Request
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.api import api_router as api_v1_router

# --- Temporary Header Logging Middleware ---
# async def log_headers_middleware(request: Request, call_next):
#     ...
# ----------------------------------------

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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
    allow_headers=["Authorization", "Content-Type", "Accept"], 
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

# Include V1 API routes
app.include_router(api_v1_router, prefix=settings.API_V1_STR)

# Add root endpoint or additional setup if needed
@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

# Add CORSMiddleware if needed later (for frontend interaction)
# from fastapi.middleware.cors import CORSMiddleware
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"] # Configure allowed origins properly
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# ) 