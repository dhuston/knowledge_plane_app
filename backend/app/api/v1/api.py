from fastapi import APIRouter

from app.api.v1.endpoints import (
    health, auth, users, integrations, teams, projects, goals, map, briefings, insights,
    notes, notifications, emergent_model, admin, ai_proxy, stream, debug, simple_auth, organizations
)

api_router = APIRouter()

# Include endpoint routers - public endpoints first
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"]) # Legacy auth
api_router.include_router(simple_auth.router, prefix="/simple-auth", tags=["simple-auth"]) # New simplified auth
api_router.include_router(debug.router, prefix="/debug", tags=["debug"])  # Debug endpoints (no auth required)

# Protected endpoints
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
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(ai_proxy.router, prefix="/ai-proxy", tags=["ai-proxy"])
api_router.include_router(organizations.router, prefix="/organizations", tags=["organizations"])
api_router.include_router(stream.router, tags=["stream"])