from typing import Any, Dict, Optional, Union, List
from uuid import UUID

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Note, User
from app.schemas import NoteCreate, NoteUpdate


class CRUDNote:
    async def create_with_author(self, db: AsyncSession, *, obj_in: NoteCreate, author: User) -> Note:
        db_obj = Note(
            **obj_in.dict(), 
            author_id=author.id, 
            tenant_id=author.tenant_id # Assume author's tenant
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        # Eager load author for immediate use if needed
        await db.refresh(db_obj, attribute_names=["author"]) 
        return db_obj

    async def get(self, db: AsyncSession, id: UUID) -> Optional[Note]:
        # Override get to eager load author
        result = await db.execute(
            select(Note).options(selectinload(Note.author))
            .where(Note.id == id)
        )
        return result.scalars().first()
        
    async def get_multi_by_project(self, db: AsyncSession, *, project_id: UUID, skip: int = 0, limit: int = 100) -> List[Note]:
        result = await db.execute(
            select(Note)
            .options(selectinload(Note.author)) # Eager load author
            .where(Note.project_id == project_id)
            .order_by(desc(Note.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_recent_by_project(self, db: AsyncSession, *, project_id: UUID, limit: int = 5) -> List[Note]:
        # Only selects fields needed for NoteReadRecent
        result = await db.execute(
            select(Note.id, Note.title, Note.created_at)
            .where(Note.project_id == project_id)
            .order_by(desc(Note.created_at))
            .limit(limit)
        )
        # Return rows directly, Pydantic will handle validation in endpoint
        return result.all() 


note = CRUDNote() 