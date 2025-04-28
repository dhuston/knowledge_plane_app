from app.db.session import async_engine
from sqlalchemy import text

async def refresh_lod_views() -> None:
    sqls = [
        "REFRESH MATERIALIZED VIEW CONCURRENTLY department_rollup;",
        "REFRESH MATERIALIZED VIEW CONCURRENTLY goal_rollup;",
    ]
    async with async_engine.begin() as conn:
        for stmt in sqls:
            await conn.execute(text(stmt)) 