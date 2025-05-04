"""Create strategic alignment tables

Revision ID: a1b2c3d4e5f6
Revises: f5081054e612
Create Date: 2023-05-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f5081054e612'  # Set to the actual previous migration
branch_labels = None
depends_on = None


def upgrade():
    # Create misalignment table
    op.create_table(
        'misalignment',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('affected_entities', JSON, nullable=False),
        sa.Column('context', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_misalignment_id', 'misalignment', ['id'], unique=False)
    op.create_index('ix_misalignment_tenant_id', 'misalignment', ['tenant_id'], unique=False)
    
    # Create recommendation table
    op.create_table(
        'recommendation',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('context', JSON, nullable=True),
        sa.Column('project_id', sa.Integer(), nullable=True),
        sa.Column('details', JSON, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recommendation_id', 'recommendation', ['id'], unique=False)
    op.create_index('ix_recommendation_tenant_id', 'recommendation', ['tenant_id'], unique=False)
    op.create_index('ix_recommendation_project_id', 'recommendation', ['project_id'], unique=False)
    
    # Create recommendation feedback table
    op.create_table(
        'recommendationfeedback',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recommendation_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('is_helpful', sa.Boolean(), nullable=False),
        sa.Column('feedback_text', sa.Text(), nullable=True),
        sa.Column('implemented', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['recommendation_id'], ['recommendation.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_recommendationfeedback_id', 'recommendationfeedback', ['id'], unique=False)
    op.create_index('ix_recommendationfeedback_recommendation_id', 'recommendationfeedback', ['recommendation_id'], unique=False)
    
    # Create impact analysis table
    op.create_table(
        'impactanalysis',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('severity', sa.String(), nullable=False),
        sa.Column('timeframe', sa.String(), nullable=False),
        sa.Column('affected_entities', JSON, nullable=False),
        sa.Column('metrics_impact', JSON, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by_user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_impactanalysis_id', 'impactanalysis', ['id'], unique=False)
    op.create_index('ix_impactanalysis_tenant_id', 'impactanalysis', ['tenant_id'], unique=False)
    
    # Create impact scenario table
    op.create_table(
        'impact_scenario',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('scenario_type', sa.String(), nullable=False),
        sa.Column('parameters', JSON, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('created_by_user_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenant.id'], ),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_impact_scenario_id', 'impact_scenario', ['id'], unique=False)
    op.create_index('ix_impact_scenario_tenant_id', 'impact_scenario', ['tenant_id'], unique=False)
    
    # Create scenario result table
    op.create_table(
        'scenarioresult',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('scenario_id', sa.Integer(), nullable=False),
        sa.Column('result_summary', JSON, nullable=False),
        sa.Column('affected_entities', JSON, nullable=False),
        sa.Column('metrics_before', JSON, nullable=False),
        sa.Column('metrics_after', JSON, nullable=False),
        sa.Column('recommendation', sa.Text(), nullable=True),
        sa.Column('visualization_data', JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['scenario_id'], ['impact_scenario.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_scenarioresult_id', 'scenarioresult', ['id'], unique=False)
    op.create_index('ix_scenarioresult_scenario_id', 'scenarioresult', ['scenario_id'], unique=False)


def downgrade():
    op.drop_table('scenarioresult')
    op.drop_table('impact_scenario')
    op.drop_table('impactanalysis')
    op.drop_table('recommendationfeedback')
    op.drop_table('recommendation')
    op.drop_table('misalignment')