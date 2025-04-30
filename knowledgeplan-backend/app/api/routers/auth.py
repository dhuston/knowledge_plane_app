from fastapi import APIRouter

# Import the actual router instance from the endpoints file
# Assuming the router instance in endpoints/auth.py is named 'router'
from app.api.v1.endpoints.auth import router as auth_endpoint_router

# You might want to create a new router here specifically for inclusion in main.py
# or re-export the one from endpoints, depending on your pattern.
# For now, let's just re-export it.
router = auth_endpoint_router 