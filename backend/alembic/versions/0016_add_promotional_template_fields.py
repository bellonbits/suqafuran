"""Add CTA button fields to email_template for promotional/campaign templates.

Revision ID: 0016_promo_template_fields
Revises: 0015_customer_segments
Create Date: 2026-08-05

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0016_promo_template_fields'
down_revision = '0015_customer_segments'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('email_template', sa.Column('action_text', sa.String(), nullable=True))
    op.add_column('email_template', sa.Column('action_url', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('email_template', 'action_url')
    op.drop_column('email_template', 'action_text')
