from fastapi import APIRouter
from app.api.v1.endpoints.briefings import router as briefings_endpoint_router

router = APIRouter()

# Include the briefings endpoint router - Removed redundant prefix
# router.include_router(briefings_endpoint_router, prefix="/briefings", tags=["briefings"])
router.include_router(briefings_endpoint_router, tags=["briefings"]) 