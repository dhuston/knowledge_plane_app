"""Baseline schema migration

Revision ID: 0001_baseline_schema
Create Date: 2025-05-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic
revision = '0001_baseline_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # This migration represents the current state of the database as it exists now
    # These commands won't actually do anything if all the tables already exist
    
    # Create extensions
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis;')
    
    # Create tenants table
    op.create_table('tenants',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('domain', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('settings', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('domain')
    )
    
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('is_superuser', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('oauth_provider', sa.String(length=50), nullable=True),
        sa.Column('oauth_user_id', sa.String(length=255), nullable=True),
        sa.Column('oauth_access_token', sa.Text(), nullable=True),
        sa.Column('oauth_refresh_token', sa.Text(), nullable=True),
        sa.Column('oauth_expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_users_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', 'tenant_id', name='uq_user_email_tenant')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=False)
    
    # Create teams table
    op.create_table('teams',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('lead_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_teams_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id', name='pk_teams')
    )
    op.create_index('ix_teams_name', 'teams', ['name'], unique=False)
    # Create foreign key from users to teams after both tables exist
    op.create_foreign_key('fk_users_team_id_teams', 'users', 'teams', ['team_id'], ['id'])
    
    # Create goals table
    op.create_table('goals',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['parent_id'], ['goals.id'], name='fk_goals_parent_id_goals'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_goals_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id', name='pk_goals')
    )
    op.create_index('ix_goals_name', 'goals', ['name'], unique=False)
    op.create_index('ix_goals_parent_id', 'goals', ['parent_id'], unique=False)
    op.create_index('ix_goals_tenant_id', 'goals', ['tenant_id'], unique=False)
    
    # Create projects table
    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('owning_team_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('goal_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['goal_id'], ['goals.id'], name='fk_projects_goal_id_goals'),
        sa.ForeignKeyConstraint(['owning_team_id'], ['teams.id'], name='fk_projects_owning_team_id_teams'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_projects_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id', name='pk_projects')
    )
    op.create_index('ix_projects_goal_id', 'projects', ['goal_id'], unique=False)
    op.create_index('ix_projects_name', 'projects', ['name'], unique=False)
    op.create_index('ix_projects_owning_team_id', 'projects', ['owning_team_id'], unique=False)
    op.create_index('ix_projects_tenant_id', 'projects', ['tenant_id'], unique=False)
    
    # Create knowledge_assets table
    op.create_table('knowledge_assets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('asset_type', sa.String(length=50), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], name='fk_knowledge_assets_project_id_projects'),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_knowledge_assets_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id', name='pk_knowledge_assets')
    )
    op.create_index('ix_knowledge_assets_asset_type', 'knowledge_assets', ['asset_type'], unique=False)
    op.create_index('ix_knowledge_assets_name', 'knowledge_assets', ['name'], unique=False)
    op.create_index('ix_knowledge_assets_project_id', 'knowledge_assets', ['project_id'], unique=False)
    op.create_index('ix_knowledge_assets_tenant_id', 'knowledge_assets', ['tenant_id'], unique=False)
    
    # Create nodes table for graph visualization
    op.create_table('nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('props', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('x', sa.Float(), nullable=True),
        sa.Column('y', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='nodes_tenant_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='nodes_pkey')
    )
    op.create_index('idx_nodes_tenant_id', 'nodes', ['tenant_id'], unique=False)
    op.create_index('idx_nodes_type', 'nodes', ['type'], unique=False)
    op.create_index('idx_nodes_xy', 'nodes', ['x', 'y'], unique=False)
    
    # Create edges table for graph relationships
    op.create_table('edges',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('src', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dst', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('label', sa.String(), nullable=False),
        sa.Column('props', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='edges_tenant_id_fkey', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='edges_pkey')
    )
    op.create_index('idx_edges_dst', 'edges', ['dst'], unique=False)
    op.create_index('idx_edges_label', 'edges', ['label'], unique=False)
    op.create_index('idx_edges_src', 'edges', ['src'], unique=False)
    op.create_index('idx_edges_tenant_id', 'edges', ['tenant_id'], unique=False)
    
    
def downgrade():
    # Remove all tables in reverse order
    op.drop_table('edges')
    op.drop_table('nodes')
    op.execute('DROP EXTENSION IF EXISTS postgis;')
    op.drop_table('knowledge_assets')
    op.drop_table('projects')
    op.drop_table('goals')
    op.drop_table('teams')
    op.drop_table('users')
    op.drop_table('tenants')