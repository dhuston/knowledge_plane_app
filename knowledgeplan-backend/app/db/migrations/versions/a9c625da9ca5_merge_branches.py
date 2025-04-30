"""Merge branches

Revision ID: a9c625da9ca5
Revises: 4b6c7d8e9f10, 3a1b2c3d4e5f
Create Date: 2025-04-26 03:02:08.180230

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a9c625da9ca5'
down_revision: Union[str, None] = ('4b6c7d8e9f10', '3a1b2c3d4e5f')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
