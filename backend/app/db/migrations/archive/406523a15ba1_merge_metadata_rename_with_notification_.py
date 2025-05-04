"""Merge metadata rename with notification tables

Revision ID: 406523a15ba1
Revises: 49a8b2c7e3df, c75a9fc0d379
Create Date: 2025-05-01 18:33:02.671279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '406523a15ba1'
down_revision: Union[str, None] = ('49a8b2c7e3df', 'c75a9fc0d379')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
