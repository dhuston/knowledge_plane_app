from fastapi import APIRouter

from app.api.endpoints import auth, users, tenants, teams, projects, goals, map # Added map
# Import integrations router later

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tenants.router, prefix="/tenants", tags=["tenants"])
api_router.include_router(teams.router, prefix="/teams", tags=["teams"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(goals.router, prefix="/goals", tags=["goals"])
api_router.include_router(map.router, prefix="/map", tags=["map"])

# Health check endpoint (optional, can be root)
@api_router.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"} 