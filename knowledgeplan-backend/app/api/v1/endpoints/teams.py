from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from app import models, schemas, crud
from app.core import security
from app.db.session import get_db_session

router = APIRouter()

@router.get("/{team_id}", response_model=schemas.Team)
async def read_team(
    team_id: UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(security.get_current_user), # Ensure requester is authenticated
) -> models.Team:
    """Gets a specific team's details by its ID."""
    # TODO: Add authorization logic - should user be in the same tenant?
    team = await crud.team.get(db, id=team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    # Optional: Check if team is in the same tenant as current_user
    # if team.tenant_id != current_user.tenant_id:
    #     raise HTTPException(status_code=403, detail="Not authorized to access this team")
    return team

# Add POST endpoint for creating teams later if needed 