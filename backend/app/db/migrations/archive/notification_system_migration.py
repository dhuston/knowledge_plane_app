"""Add notification tables

Revision ID: 49a8b2c7e3df
Revises: f5081054e612
Create Date: 2025-05-01 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '49a8b2c7e3df'
down_revision = 'f5081054e612'
branch_labels = None
depends_on = None


def upgrade():
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(), nullable=False),
        sa.Column('tenant_id', postgresql.UUID(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=True),
        sa.Column('entity_id', postgresql.UUID(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('action_url', sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create notification_recipients table
    op.create_table(
        'notification_recipients',
        sa.Column('notification_id', postgresql.UUID(), nullable=False),
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['notification_id'], ['notifications.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('notification_id', 'user_id')
    )
    
    # Create notification_preferences table
    op.create_table(
        'notification_preferences',
        sa.Column('user_id', postgresql.UUID(), nullable=False),
        sa.Column('notification_type', sa.String(length=50), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, default=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('user_id', 'notification_type')
    )
    
    # Create indexes
    op.create_index(
        'ix_notifications_tenant_id', 
        'notifications', 
        ['tenant_id']
    )
    op.create_index(
        'ix_notifications_created_at', 
        'notifications', 
        ['created_at']
    )
    op.create_index(
        'ix_notifications_expires_at', 
        'notifications', 
        ['expires_at']
    )
    op.create_index(
        'ix_notification_recipients_user_id', 
        'notification_recipients', 
        ['user_id']
    )
    op.create_index(
        'ix_notification_recipients_read_at', 
        'notification_recipients', 
        ['read_at']
    )
    op.create_index(
        'ix_notification_recipients_dismissed_at', 
        'notification_recipients', 
        ['dismissed_at']
    )
    

def downgrade():
    op.drop_table('notification_preferences')
    op.drop_table('notification_recipients')
    op.drop_table('notifications')