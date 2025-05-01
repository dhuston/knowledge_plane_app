"""Rename metadata columns to relationship_metadata and pattern_metadata

Revision ID: c75a9fc0d379
Revises: 
Create Date: 2025-05-01 14:21:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'c75a9fc0d379'
down_revision: Union[str, None] = '1af39b5fb3bc'  # Set to one of the current heads
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Since the tables don't exist yet, we don't need to rename anything
    # The updated models will be used when the tables are created
    pass


def downgrade() -> None:
    """Downgrade schema."""
    # No changes needed for downgrade since we didn't make changes in upgrade
    pass