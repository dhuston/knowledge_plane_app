"""Add settings and is_active fields to tenant model

Revision ID: add_tenant_fields_01
Revises: add_password_auth_01
Create Date: 2025-05-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_tenant_fields_01'
down_revision = 'add_password_auth_01'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new fields to tenant table
    op.add_column('tenants', sa.Column('settings', sa.JSON(), nullable=True))
    op.add_column('tenants', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))


def downgrade() -> None:
    # Remove fields from tenant table
    op.drop_column('tenants', 'is_active')
    op.drop_column('tenants', 'settings')