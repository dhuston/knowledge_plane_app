"""Add PostGIS extension and spatial columns to nodes table

Revision ID: spatial_indexing_001
Revises: 4b6c7d8e9f10
Create Date: 2025-05-03
"""
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'spatial_indexing_001'
down_revision = '4b6c7d8e9f10'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable PostGIS extension
    op.execute('CREATE EXTENSION IF NOT EXISTS postgis')
    
    # Add spatial columns to nodes table
    op.add_column('nodes', sa.Column('x', sa.Float(), nullable=True))
    op.add_column('nodes', sa.Column('y', sa.Float(), nullable=True))
    op.add_column('nodes', sa.Column('position', Geometry('POINT'), nullable=True))
    
    # Create spatial index on position column
    op.execute('CREATE INDEX idx_nodes_position ON nodes USING GIST(position)')
    
    # Create function to automatically update the position geometry from x, y coordinates
    op.execute('''
    CREATE OR REPLACE FUNCTION update_node_position()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.x IS NOT NULL AND NEW.y IS NOT NULL THEN
            NEW.position = ST_SetSRID(ST_MakePoint(NEW.x, NEW.y), 4326);
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    ''')
    
    # Create trigger to maintain position column
    op.execute('''
    CREATE TRIGGER trigger_update_node_position
    BEFORE INSERT OR UPDATE ON nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_node_position();
    ''')


def downgrade() -> None:
    # Drop trigger and function
    op.execute('DROP TRIGGER IF EXISTS trigger_update_node_position ON nodes')
    op.execute('DROP FUNCTION IF EXISTS update_node_position()')
    
    # Drop spatial index
    op.execute('DROP INDEX IF EXISTS idx_nodes_position')
    
    # Drop spatial columns
    op.drop_column('nodes', 'position')
    op.drop_column('nodes', 'y')
    op.drop_column('nodes', 'x')
    
    # We're not removing the PostGIS extension since other tables might depend on it