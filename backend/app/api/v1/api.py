from fastapi import APIRouter

from app.api.v1.endpoints import (
    health, auth, users, integrations, teams, projects, goals, map, briefings, insights,
    notes, notifications, emergent_model
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
api_router.include_router(briefings.router, prefix="/briefings", tags=["briefings"])
api_router.include_router(insights.router, prefix="/insights", tags=["insights"])
api_router.include_router(notes.router, prefix="/notes", tags=["notes"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(emergent_model.router, prefix="/emergent-model", tags=["emergent-model"])