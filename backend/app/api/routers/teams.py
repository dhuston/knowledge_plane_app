from fastapi import APIRouter

# Import the actual router instance from the endpoints file
# Assuming the router instance in endpoints/teams.py is named 'router'
from app.api.v1.endpoints.teams import router as teams_endpoint_router

# Re-export the router
router = teams_endpoint_router 