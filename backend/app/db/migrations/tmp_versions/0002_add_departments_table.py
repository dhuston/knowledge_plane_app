"""Add departments table

Revision ID: 0002_add_departments_table
Revises: 0001_baseline_schema
Create Date: 2025-05-04
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic
revision = '0002_add_departments_table'
down_revision = '0001_baseline_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Create departments table
    op.create_table('departments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tenant_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_departments_tenant_id_tenants'),
        sa.PrimaryKeyConstraint('id', name='pk_departments')
    )
    op.create_index('ix_departments_name', 'departments', ['name'], unique=False)
    op.create_index('ix_departments_tenant_id', 'departments', ['tenant_id'], unique=False)
    
    # Add department_id to teams
    op.add_column('teams', 
        sa.Column('department_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key('fk_teams_department_id_departments', 'teams', 'departments', ['department_id'], ['id'])


def downgrade():
    # First drop the foreign key
    op.drop_constraint('fk_teams_department_id_departments', 'teams', type_='foreignkey')
    
    # Then drop the department_id column
    op.drop_column('teams', 'department_id')
    
    # Finally drop the departments table
    op.drop_index('ix_departments_tenant_id', table_name='departments')
    op.drop_index('ix_departments_name', table_name='departments')
    op.drop_table('departments')