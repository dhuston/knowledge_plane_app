from fastapi import FastAPI
from app.core.config import settings
from app.api.v1.api import api_router as api_v1_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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