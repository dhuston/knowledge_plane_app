from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Optional, Set, Tuple

from app.crud.crud_user import user as crud_user
from app.crud.crud_team import team as crud_team
from app.crud.crud_project import project as crud_project
from app.crud.crud_goal import goal as crud_goal
from app import models, schemas
from app.core import security
from app.db.session import get_db_session
from app.services.insight_service import insight_service

router = APIRouter()

@router.get("/project_overlaps", response_model=schemas.ProjectOverlapResponse)
async def get_project_overlaps(
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user),
) -> Dict:
    """Retrieve potential project overlaps within the user's tenant."""
    overlap_data = await insight_service.find_project_overlaps(
        db=db, 
        tenant_id=current_user.tenant_id
    )
    return {"overlaps": overlap_data} 