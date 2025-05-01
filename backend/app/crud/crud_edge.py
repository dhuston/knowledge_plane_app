from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.models.edge import Edge

class CRUDEdge:
    async def create(self, db: AsyncSession, *, tenant_id: UUID, src: UUID, dst: UUID, label: str, props: Optional[Dict[str, Any]] = None) -> Edge:
        db_obj = Edge(id=uuid4(), tenant_id=tenant_id, src=src, dst=dst, label=label, props=props or {})
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # emit delta event
        try:
            from app.core.kafka_producer import publish
            import asyncio
            asyncio.create_task(publish("graph-delta", {"type":"edge_created","edge": {"id": str(db_obj.id), "src": str(db_obj.src), "dst": str(db_obj.dst), "label": db_obj.label}}))
        except ImportError:
            pass

        return db_obj

    async def get(self, db: AsyncSession, *, id: UUID) -> Optional[Edge]:
        stmt = select(Edge).where(Edge.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_src(self, db: AsyncSession, *, tenant_id: UUID, src: UUID, limit: int = 200) -> List[Edge]:
        stmt = select(Edge).where(Edge.tenant_id == tenant_id, Edge.src == src).limit(limit)
        result = await db.execute(stmt)
        return result.scalars().all()

    async def remove(self, db: AsyncSession, *, id: UUID) -> None:
        await db.execute(delete(Edge).where(Edge.id == id))
        await db.commit()

edge = CRUDEdge() 