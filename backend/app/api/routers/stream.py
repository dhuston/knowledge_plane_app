from fastapi import APIRouter
from app.api.v1.endpoints.stream import router as stream_endpoint_router

router: APIRouter = stream_endpoint_router 