from fastapi import APIRouter
from app.api.v1.endpoints.insights import router as insights_endpoint_router

router = APIRouter()

# Include the insights endpoint router - Removed redundant prefix
# router.include_router(insights_endpoint_router, prefix="/insights", tags=["insights"])
router.include_router(insights_endpoint_router, tags=["insights"]) 