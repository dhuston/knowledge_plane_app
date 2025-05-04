"""merge_all_current_heads

Revision ID: 7aeeb09e9fba
Revises: 48389b2d26f0, combined_fixes_and_settings, fix_password_auth, fix_tenant_model, a1b2c3d4e5f6
Create Date: 2025-05-04 18:42:53.844472

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7aeeb09e9fba'
down_revision: Union[str, None] = ('48389b2d26f0', 'combined_fixes_and_settings', 'fix_password_auth', 'fix_tenant_model', 'a1b2c3d4e5f6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
