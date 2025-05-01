"""Add integration framework tables

Revision ID: 97a124bfd8a5
Revises: f5081054e612
Create Date: 2023-05-01 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '97a124bfd8a5'
down_revision = 'f5081054e612'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create integrations table
    op.create_table(
        'integrations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('integration_type', sa.String(), nullable=False),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('schedule', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    
    op.create_index('ix_integrations_tenant_type', 'integrations', ['tenant_id', 'integration_type'])
    
    # Create integration_credentials table
    op.create_table(
        'integration_credentials',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('integration_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('integrations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('credential_type', sa.String(), nullable=False),
        sa.Column('credentials', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    
    # Create integration_runs table
    op.create_table(
        'integration_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('integration_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('integrations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('start_time', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('end_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('entity_count', sa.Integer(), default=0, nullable=False),
        sa.Column('relationship_count', sa.Integer(), default=0, nullable=False),
        sa.Column('error_count', sa.Integer(), default=0, nullable=False),
        sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    
    op.create_index('ix_integration_runs_integration_id_start_time', 'integration_runs', ['integration_id', 'start_time'])


def downgrade() -> None:
    op.drop_table('integration_runs')
    op.drop_table('integration_credentials')
    op.drop_table('integrations')