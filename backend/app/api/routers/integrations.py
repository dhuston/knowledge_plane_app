from fastapi import APIRouter

# Import the actual router instance from the endpoints file
# Assuming the router instance in endpoints/integrations.py is named 'router'
from app.api.v1.endpoints.integrations import router as integrations_endpoint_router

# Re-export the router
router = integrations_endpoint_router 