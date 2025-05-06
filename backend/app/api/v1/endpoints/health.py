from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()


@router.get("/", status_code=200)
def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "OK"}


@router.options("/", status_code=200)
async def health_options() -> dict:
    """Handle OPTIONS preflight requests for health endpoint."""
    return {"status": "OK"}


@router.head("/", status_code=200)
async def health_head():
    """Handle HEAD requests for health endpoint."""
    return {"status": "OK"}