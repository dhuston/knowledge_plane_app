"""merge_all_heads

Revision ID: 48389b2d26f0
Revises: 406523a15ba1, add_tenant_fields_01, 97a124bfd8a5
Create Date: 2025-05-03 23:19:03.322414

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '48389b2d26f0'
down_revision: Union[str, None] = ('406523a15ba1', 'add_tenant_fields_01', '97a124bfd8a5')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
