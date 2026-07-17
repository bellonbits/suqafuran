"""Add market field to user for shop location tracking.

Revision ID: market_001
Revises: 799b15fdf310
Create Date: 2026-07-17 11:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'market_001'
down_revision = '799b15fdf310'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add market column to user table
    op.add_column('users', sa.Column('market', sa.String(), nullable=True))
    # Create index on market for faster filtering
    op.create_index(op.f('ix_users_market'), 'users', ['market'], unique=False)


def downgrade() -> None:
    # Remove index
    op.drop_index(op.f('ix_users_market'), table_name='users')
    # Remove column
    op.drop_column('users', 'market')
