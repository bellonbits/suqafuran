"""Create product_field_changes table for category-based bulk edit audit trail.

Also merges the two existing migration heads (0016_promo_template_fields and
41faba4aa970) back into one line so `alembic upgrade head` has a single
target again.

Revision ID: 0017_bulk_category_edit_audit
Revises: 0016_promo_template_fields, 41faba4aa970
Create Date: 2026-08-11 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0017_bulk_category_edit_audit'
down_revision = ('0016_promo_template_fields', '41faba4aa970')
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'product_field_changes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('listing_id', sa.Integer(), nullable=False, index=True),
        sa.Column('field', sa.String(32), nullable=False),
        sa.Column('old_value', sa.Text(), nullable=True),
        sa.Column('new_value', sa.Text(), nullable=True),
        sa.Column('changed_at', sa.DateTime(), nullable=False, index=True, server_default=sa.func.now()),
        sa.Column('changed_by', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['listing_id'], ['listing.id'], ),
        sa.ForeignKeyConstraint(['changed_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('product_field_changes')
