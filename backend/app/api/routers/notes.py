from fastapi import APIRouter
from app.api.v1.endpoints.notes import router as notes_endpoint_router

router = APIRouter()

# Include the notes endpoint router - Remove redundant prefix
# router.include_router(notes_endpoint_router, prefix="/notes", tags=["notes"])
router.include_router(notes_endpoint_router, tags=["notes"]) 