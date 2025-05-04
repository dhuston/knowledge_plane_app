"""Add password authentication fields to user model

Revision ID: fix_password_auth
Revises: add_tenant_settings
Create Date: 2025-05-03 21:07:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fix_password_auth'
down_revision: Union[str, None] = 'add_tenant_settings'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add password authentication related fields to user table
    op.add_column('users', sa.Column('hashed_password', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('password_reset_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('password_reset_expires', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove password authentication fields
    op.drop_column('users', 'password_reset_expires')
    op.drop_column('users', 'password_reset_token')
    op.drop_column('users', 'hashed_password')