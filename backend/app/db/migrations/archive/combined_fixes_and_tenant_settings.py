"""Combined fixes and tenant settings migration

Revision ID: combined_fixes_and_settings
Revises: 12819ed4b9bd
Create Date: 2025-05-04 09:00:00.000000

This migration consolidates several separate fixes into a single migration:
- Added password authentication fields to user model
- Added tenant settings and is_active fields
- Added tenant settings fields from separate migrations

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'combined_fixes_and_settings'
down_revision: Union[str, None] = '12819ed4b9bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add password authentication related fields to user table
    op.add_column('users', sa.Column('hashed_password', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))
    
    # Add settings and is_active column to tenants table
    op.add_column('tenants', sa.Column('settings', sa.JSON(), nullable=True))
    op.add_column('tenants', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))
    
    # Add specific tenant settings fields
    op.add_column('tenants', sa.Column('max_users', sa.Integer(), nullable=True))
    op.add_column('tenants', sa.Column('max_storage_gb', sa.Integer(), nullable=True))
    op.add_column('tenants', sa.Column('theme_settings', sa.JSON(), nullable=True))
    op.add_column('tenants', sa.Column('feature_flags', sa.JSON(), nullable=True))
    op.add_column('tenants', sa.Column('integration_limits', sa.JSON(), nullable=True))


def downgrade() -> None:
    # Remove tenant settings fields
    op.drop_column('tenants', 'integration_limits')
    op.drop_column('tenants', 'feature_flags')
    op.drop_column('tenants', 'theme_settings')
    op.drop_column('tenants', 'max_storage_gb')
    op.drop_column('tenants', 'max_users')
    
    # Remove tenant fields
    op.drop_column('tenants', 'is_active')
    op.drop_column('tenants', 'settings')
    
    # Remove password authentication fields
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'hashed_password')