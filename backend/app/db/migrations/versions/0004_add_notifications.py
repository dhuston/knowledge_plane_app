"""Add notifications tables
Revision ID: 0004_add_notifications
Revises: 0003_add_admin_flag
Create Date: 2025-05-06
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic
revision = '0004_add_notifications'
down_revision = '0003_add_admin_flag'
branch_labels = None
depends_on = None


def upgrade():
    # Create notifications table if it doesn't exist
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_notifications_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id', name='pk_notifications')
    )
    
    # Create notification_recipients table if it doesn't exist
    op.create_table(
        'notification_recipients',
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], name='fk_notification_recipients_notification_id_notifications', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_notification_recipients_user_id_users'),
        sa.PrimaryKeyConstraint('notification_id', 'user_id', name='pk_notification_recipients')
    )
    
    # Create indexes
    op.create_index('ix_notifications_tenant_id', 'notifications', ['tenant_id'])
    op.create_index('ix_notifications_entity_id', 'notifications', ['entity_id'])
    op.create_index('ix_notification_recipients_user_id', 'notification_recipients', ['user_id'])


def downgrade():
    # Drop tables in reverse order
    op.drop_index('ix_notification_recipients_user_id', table_name='notification_recipients')
    op.drop_index('ix_notifications_entity_id', table_name='notifications')
    op.drop_index('ix_notifications_tenant_id', table_name='notifications')
    
    op.drop_table('notification_recipients')
    op.drop_table('notifications')