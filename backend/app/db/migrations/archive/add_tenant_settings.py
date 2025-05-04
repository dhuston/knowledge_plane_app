"""Add settings column to tenant table

Revision ID: add_tenant_settings
Revises: add_tenant_is_active
Create Date: 2025-05-03 21:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'add_tenant_settings'
down_revision: Union[str, None] = 'add_tenant_is_active'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add settings column to tenants table
    op.add_column('tenants',
                  sa.Column('settings', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    op.drop_column('tenants', 'settings')