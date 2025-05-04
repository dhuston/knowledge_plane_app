"""Add is_active column to tenant table

Revision ID: add_tenant_is_active
Revises: 016f196dbf5a
Create Date: 2025-05-03 21:04:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_tenant_is_active'
down_revision: Union[str, None] = '016f196dbf5a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add is_active column to tenants table with default True
    op.add_column('tenants',
                  sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'))
    op.create_index(op.f('ix_tenants_is_active'), 'tenants', ['is_active'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tenants_is_active'), table_name='tenants')
    op.drop_column('tenants', 'is_active')