"""create lod materialized views

Revision ID: 4b6c7d8e9f10
Revises: dc1a3f0aa2bd
Create Date: 2024-03-25
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '4b6c7d8e9f10'
down_revision = 'dc1a3f0aa2bd'
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Department roll-up view
    op.execute(
        """
        CREATE MATERIALIZED VIEW department_rollup AS
        SELECT d.id,
               d.tenant_id,
               d.name,
               COUNT(DISTINCT u.id)      AS member_count,
               COUNT(DISTINCT p.id)      AS project_count,
               COUNT(DISTINCT g.id)      AS goal_count
        FROM departments d
        LEFT JOIN teams t ON t.department_id = d.id
        LEFT JOIN users u ON u.team_id = t.id
        LEFT JOIN projects p ON p.owning_team_id = t.id
        LEFT JOIN goals g ON g.id = p.goal_id
        GROUP BY d.id;
        """
    )
    op.execute("CREATE UNIQUE INDEX uq_department_rollup_id ON department_rollup (id);")
    op.execute("CREATE INDEX ix_department_rollup_tenant ON department_rollup (tenant_id);")

    # Goal roll-up view
    op.execute(
        """
        CREATE MATERIALIZED VIEW goal_rollup AS
        SELECT g.id,
               g.tenant_id,
               g.title,
               COUNT(DISTINCT p.id)              AS project_count,
               COUNT(DISTINCT cg.id)             AS child_goal_count
        FROM goals g
        LEFT JOIN projects p ON p.goal_id = g.id
        LEFT JOIN goals cg ON cg.parent_id = g.id
        GROUP BY g.id;
        """
    )
    op.execute("CREATE UNIQUE INDEX uq_goal_rollup_id ON goal_rollup (id);")
    op.execute("CREATE INDEX ix_goal_rollup_tenant ON goal_rollup (tenant_id);")


def downgrade() -> None:
    op.execute("DROP MATERIALIZED VIEW IF EXISTS goal_rollup;")
    op.execute("DROP MATERIALIZED VIEW IF EXISTS department_rollup;") 