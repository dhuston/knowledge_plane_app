"""Add is_admin flag to users table

Revision ID: 0003_add_admin_flag
Revises: 0002_add_notif_prefs
Create Date: 2025-05-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic
revision = '0003_add_admin_flag'
down_revision = '0002_add_notif_prefs'
branch_labels = None
depends_on = None


def upgrade():
    # Add is_admin column with default value False
    op.add_column(
        'users',
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.text('FALSE'))
    )

    # Create index for is_admin column for faster filtering
    op.create_index('ix_users_is_admin', 'users', ['is_admin'])


def downgrade():
    # Drop index first
    op.drop_index('ix_users_is_admin', table_name='users')
    
    # Then drop the column
    op.drop_column('users', 'is_admin')