from fastapi import APIRouter

from app.api.v1.endpoints import (
    health, auth, users, integrations, teams, projects, goals, map
)

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(map.router, prefix="/map", tags=["map"])

# Include other routers here later (e.g., projects)
# api_router.include_router(projects.router, prefix="/projects", tags=["projects"]) 