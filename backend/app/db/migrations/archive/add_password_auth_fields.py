"""Add password authentication fields to user model

Revision ID: add_password_auth_01
Revises: spatial_indexing_001
Create Date: 2025-05-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_password_auth_01'
down_revision = 'spatial_indexing_001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add password authentication related fields to user table
    op.add_column('users', sa.Column('hashed_password', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))
    
    # Update auth_provider comment
    op.execute("""
    COMMENT ON COLUMN users.auth_provider IS 'Authentication provider (e.g., google, microsoft, password)';
    """)


def downgrade() -> None:
    # Remove password authentication fields
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'hashed_password')