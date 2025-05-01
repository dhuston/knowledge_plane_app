from fastapi import APIRouter

# Import the actual router instance from the endpoints file
# Assuming the router instance in endpoints/users.py is named 'router'
from app.api.v1.endpoints.users import router as users_endpoint_router

# Re-export the router
router = users_endpoint_router 