from typing import Any, Dict, Optional, Union, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate

class CRUDDepartment():
    async def get(self, db: AsyncSession, id: UUID) -> Optional[Department]:
        """Gets a single department by ID."""
        result = await db.execute(select(Department).where(Department.id == id))
        return result.scalars().first()

    async def get_by_name(self, db: AsyncSession, *, name: str, tenant_id: UUID) -> Optional[Department]:
        result = await db.execute(select(Department).where(Department.name == name, Department.tenant_id == tenant_id))
        return result.scalars().first()

    async def create_with_tenant(self, db: AsyncSession, *, obj_in: DepartmentCreate, tenant_id: UUID) -> Department:
        db_obj = Department(
            name=obj_in.name,
            description=obj_in.description,
            tenant_id=tenant_id
        )
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)
        return db_obj

    async def get_multi_by_tenant(
        self, db: AsyncSession, *, tenant_id: UUID, skip: int = 0, limit: int = 100
    ) -> List[Department]:
        result = await db.execute(
            select(Department)
            .where(Department.tenant_id == tenant_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    # You might override update/remove if specific logic is needed, e.g., checking dependencies
    # async def update(...): pass
    # async def remove(...): pass

department = CRUDDepartment() 