'''add nodes edges tables

Revision ID: 3a1b2c3d4e5f
Revises: f5081054e612
Create Date: 2024-03-25
'''
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3a1b2c3d4e5f'
down_revision = 'f5081054e612'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('props', sa.JSON(), nullable=True),
    )
    op.create_index('ix_nodes_tenant_id', 'nodes', ['tenant_id'])
    op.create_index('ix_nodes_type', 'nodes', ['type'])

    op.create_table(
        'edges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('src', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dst', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('props', sa.JSON(), nullable=True),
    )
    op.create_index('ix_edges_src', 'edges', ['tenant_id', 'src'])
    op.create_index('ix_edges_dst', 'edges', ['tenant_id', 'dst'])
    op.create_index('ix_edges_label', 'edges', ['tenant_id', 'label'])


def downgrade() -> None:
    op.drop_index('ix_edges_label', table_name='edges')
    op.drop_index('ix_edges_dst', table_name='edges')
    op.drop_index('ix_edges_src', table_name='edges')
    op.drop_table('edges')

    op.drop_index('ix_nodes_type', table_name='nodes')
    op.drop_index('ix_nodes_tenant_id', table_name='nodes')
    op.drop_table('nodes') 