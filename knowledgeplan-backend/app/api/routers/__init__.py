from fastapi import APIRouter

# Import individual feature routers
from .auth import router as auth_router
from .users import router as users_router
from .teams import router as teams_router
from .projects import router as projects_router
from .map import router as map_router
from .goals import router as goals_router
from .briefings import router as briefings_router
from .insights import router as insights_router
from .notes import router as notes_router
from .stream import router as stream_router

api_router = APIRouter()

# Include feature routers with prefixes
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(teams_router, prefix="/teams", tags=["teams"])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(map_router, prefix="/map", tags=["map"])
api_router.include_router(goals_router, prefix="/goals", tags=["goals"])
api_router.include_router(briefings_router, prefix="/briefings", tags=["briefings"])
api_router.include_router(insights_router, prefix="/insights", tags=["insights"])
api_router.include_router(notes_router)
api_router.include_router(stream_router, tags=["stream"])

__all__ = [
    "auth_router",
    "goals_router",
    "map_router",
    "projects_router",
    "users_router",
    "teams_router",
    "briefings_router",
    "insights_router",
    "notes_router",
] 