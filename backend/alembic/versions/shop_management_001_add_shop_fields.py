"""Add shop management fields to users table

Revision ID: shop_mgmt_001
Revises:
Create Date: 2026-07-05 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'shop_mgmt_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add shop management fields to users table
    op.add_column('users', sa.Column('shop_description', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('free_delivery', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    # Remove shop management fields from users table
    op.drop_column('users', 'free_delivery')
    op.drop_column('users', 'is_featured')
    op.drop_column('users', 'shop_description')
