from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.crud_user import user as crud_user
from app.services.briefing_service import briefing_service
from app import models, schemas
from app.core import security
from app.db.session import get_db_session

router = APIRouter()

@router.get("/daily", response_model=schemas.BriefingResponse)
async def get_daily_briefing(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
):
    """Retrieve the AI-generated daily briefing summary for the current user."""
    summary = await briefing_service.get_daily_briefing(db=db, user=current_user)
    return schemas.BriefingResponse(summary=summary) 