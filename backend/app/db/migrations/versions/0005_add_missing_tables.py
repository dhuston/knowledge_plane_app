"""Add missing tables

Revision ID: 0005_add_missing_tables
Create Date: 2023-05-07
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = '0005_add_missing_tables'
down_revision = '0004_add_notifications'
branch_labels = None
depends_on = None

def upgrade():
    # Create nodes table
    op.create_table(
        'nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('type', sa.String(), nullable=False, index=True),
        sa.Column('props', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('x', sa.Float(), nullable=True),
        sa.Column('y', sa.Float(), nullable=True)
    )
    
    # Create composite index on x,y for faster 2D queries
    op.create_index('ix_nodes_xy', 'nodes', ['x', 'y'])
    
    # Create edges table
    op.create_table(
        'edges',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('src', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('dst', postgresql.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column('label', sa.String(), nullable=False, index=True),
        sa.Column('props', postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )
    
    # Create composite indices for edges
    op.create_index('ix_edges_src', 'edges', ['tenant_id', 'src'])
    op.create_index('ix_edges_dst', 'edges', ['tenant_id', 'dst'])
    op.create_index('ix_edges_label', 'edges', ['tenant_id', 'label'])
    
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('name', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, default='active'),
        sa.Column('owning_team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('teams.id'), nullable=True, index=True),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), nullable=True, index=True),  # FK added after goal table creation
        sa.Column('properties', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    
    # Create goals table
    op.create_table(
        'goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('title', sa.String(255), nullable=False, index=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('type', sa.String(50), nullable=False, index=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('goals.id'), nullable=True, index=True),
        sa.Column('status', sa.String(50), nullable=True, default='on_track'),
        sa.Column('progress', sa.Integer(), nullable=True, default=0),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('properties', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    
    # Add goal_id foreign key to projects
    op.create_foreign_key(
        'fk_projects_goal_id_goals',
        'projects', 'goals',
        ['goal_id'], ['id']
    )
    
    # Create knowledge assets table
    op.create_table(
        'knowledge_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id'), nullable=False, index=True),
        sa.Column('title', sa.String(255), nullable=True, index=True),
        sa.Column('type', sa.String(50), nullable=False, index=True),
        sa.Column('source', sa.String(100), nullable=True),
        sa.Column('link', sa.Text(), nullable=True),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True, index=True),
        sa.Column('created_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True, index=True),
        sa.Column('properties', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now())
    )
    
    # Create project_participants table
    op.create_table(
        'project_participants',
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), primary_key=True)
    )

def downgrade():
    op.drop_table('project_participants')
    op.drop_table('knowledge_assets')
    op.drop_foreign_key('fk_projects_goal_id_goals', 'projects')
    op.drop_table('goals')
    op.drop_table('projects')
    op.drop_index('ix_edges_label', table_name='edges')
    op.drop_index('ix_edges_dst', table_name='edges')
    op.drop_index('ix_edges_src', table_name='edges')
    op.drop_table('edges')
    op.drop_index('ix_nodes_xy', table_name='nodes')
    op.drop_table('nodes')