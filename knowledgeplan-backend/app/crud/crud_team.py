import uuid
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.team import Team
from app.models.user import User
from app.schemas.team import TeamCreate, TeamUpdate # Use TeamUpdate if needed later

class CRUDTeam():
    async def get(self, db: AsyncSession, id: uuid.UUID) -> Optional[Team]:
        statement = select(Team).where(Team.id == id)
        result = await db.execute(statement)
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, *, obj_in: TeamCreate) -> Team:
        """Creates a new team."""
        db_obj = Team(
            id=uuid.uuid4(), 
            name=obj_in.name, 
            description=obj_in.description,
            tenant_id=obj_in.tenant_id 
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    # Add update, delete, get_multi etc. as needed

    async def get_member_ids(self, db: AsyncSession, *, team_id: uuid.UUID) -> List[uuid.UUID]:
        """Returns a list of user IDs for members of the specified team."""
        stmt = select(User.id).where(User.team_id == team_id)
        result = await db.execute(stmt)
        return result.scalars().all()

team = CRUDTeam()