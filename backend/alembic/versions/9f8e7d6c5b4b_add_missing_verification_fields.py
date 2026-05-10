"""add missing verification fields

Revision ID: 9f8e7d6c5b4b
Revises: 9f8e7d6c5b4a
Create Date: 2026-05-10 22:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = '9f8e7d6c5b4b'
down_revision = '9f8e7d6c5b4a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add tier, notes, document_urls, selfie_url, etc. to verificationrequest
    # Using batch_alter_table for SQLite compatibility if needed, though we use Postgres
    with op.batch_alter_table('verificationrequest', schema=None) as batch_op:
        batch_op.add_column(sa.Column('tier', sa.String(), nullable=False, server_default='tier2'))
        batch_op.add_column(sa.Column('notes', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('document_urls', sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column('selfie_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('proof_of_address_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('video_selfie_url', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('facial_match_score', sa.Float(), nullable=True))
        batch_op.add_column(sa.Column('auto_verification_status', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('verificationrequest', schema=None) as batch_op:
        batch_op.drop_column('auto_verification_status')
        batch_op.drop_column('facial_match_score')
        batch_op.drop_column('video_selfie_url')
        batch_op.drop_column('proof_of_address_url')
        batch_op.drop_column('selfie_url')
        batch_op.drop_column('document_urls')
        batch_op.drop_column('notes')
        batch_op.drop_column('tier')
