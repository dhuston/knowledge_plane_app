from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db_session
from app.core.security import get_current_user
from app import models, schemas

router = APIRouter()

@router.get("/overview", response_model=schemas.MapData)
async def get_overview(
    level: str = Query("department", enum=["department", "goal"]),
    db: AsyncSession = Depends(get_db_session),
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """Return summary nodes from roll-up materialized views."""
    if level == "department":
        stmt = text("SELECT id,name,member_count,project_count,goal_count FROM department_rollup WHERE tenant_id=:tid")
    else:
        stmt = text("SELECT id,title,project_count,child_goal_count FROM goal_rollup WHERE tenant_id=:tid")
    result = await db.execute(stmt, {"tid": str(current_user.tenant_id)})
    rows = result.fetchall()

    nodes: List[schemas.MapNode] = []
    for row in rows:
        if level == "department":
            node_id, name, mem, proj, gol = row
            nodes.append(schemas.MapNode(id=str(node_id), type=schemas.MapNodeTypeEnum.DEPARTMENT, label=name, data={"memberCount":mem,"projectCount":proj,"goalCount":gol}))
        else:
            node_id, title, proj, kids = row
            nodes.append(schemas.MapNode(id=str(node_id), type=schemas.MapNodeTypeEnum.GOAL, label=title, data={"projectCount":proj,"childGoals":kids}))
    return schemas.MapData(nodes=nodes, edges=[]) 