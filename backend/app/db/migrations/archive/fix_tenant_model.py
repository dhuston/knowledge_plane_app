"""Fix tenant model by adding settings column

Revision ID: fix_tenant_model
Revises: 12819ed4b9bd
Create Date: 2025-05-03 21:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'fix_tenant_model'
down_revision: Union[str, None] = '12819ed4b9bd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add settings and is_active column to tenants table
    op.add_column('tenants', sa.Column('settings', sa.JSON(), nullable=True))
    op.add_column('tenants', sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False))


def downgrade() -> None:
    op.drop_column('tenants', 'is_active')
    op.drop_column('tenants', 'settings')