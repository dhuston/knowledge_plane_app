"""Add notification preferences table

Revision ID: 0002_add_notif_prefs
Revises: 0001_baseline_schema
Create Date: 2025-05-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic
revision = '0002_add_notif_prefs'
down_revision = '0001_baseline_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create notification_preferences table if it doesn't exist
    op.create_table('notification_preferences',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('notification_type', sa.String(50), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('email_enabled', sa.Boolean(), nullable=False, default=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_notification_preferences_user_id_users'),
        sa.PrimaryKeyConstraint('user_id', 'notification_type', name='pk_notification_preferences')
    )
    
    # Create index on user_id for faster lookups
    op.create_index('ix_notification_preferences_user_id', 'notification_preferences', ['user_id'], unique=False)


def downgrade():
    # Drop the index first
    op.drop_index('ix_notification_preferences_user_id', table_name='notification_preferences')
    
    # Drop the table
    op.drop_table('notification_preferences')