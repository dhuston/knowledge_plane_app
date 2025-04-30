from typing import Any, Dict, List, Optional, Union
from uuid import UUID, uuid4
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from app.models.node import Node
from app.schemas import map as map_schemas

class CRUDNode:
    async def create(self, db: AsyncSession, *, tenant_id: UUID, node_type: str, props: Optional[Dict[str, Any]] = None) -> Node:
        db_obj = Node(id=uuid4(), tenant_id=tenant_id, type=node_type, props=props or {})
        db.add(db_obj)
        await db.commit()
        await db.refresh(db_obj)

        # emit delta event
        try:
            from app.core.kafka_producer import publish
            asyncio.create_task(publish("graph-delta", {"type":"node_created","node": {"id": str(db_obj.id), "type": db_obj.type, "props": db_obj.props}}))
        except ImportError:
            pass

        return db_obj

    async def get(self, db: AsyncSession, *, id: UUID) -> Optional[Node]:
        stmt = select(Node).where(Node.id == id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi_by_ids(self, db: AsyncSession, *, ids: List[UUID]) -> List[Node]:
        stmt = select(Node).where(Node.id.in_(ids))
        result = await db.execute(stmt)
        return result.scalars().all()

    async def update_props(self, db: AsyncSession, *, id: UUID, props: Dict[str, Any]) -> Optional[Node]:
        stmt = (
            update(Node)
            .where(Node.id == id)
            .values(props=props)
            .execution_options(synchronize_session="fetch")
        )
        await db.execute(stmt)
        await db.commit()
        return await self.get(db, id=id)

    async def remove(self, db: AsyncSession, *, id: UUID) -> None:
        stmt = delete(Node).where(Node.id == id)
        await db.execute(stmt)
        await db.commit()

node = CRUDNode() 