"""bilingual content overhaul

Revision ID: f2e1d0c9b8a7
Revises: d53d51871762
Create Date: 2024-04-13 17:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f2e1d0c9b8a7'
down_revision = 'd53d51871762'
branch_labels = None
depends_on = None

def upgrade():
    # --- Category ---
    op.alter_column('category', 'name', new_column_name='name_en')
    op.add_column('category', sa.Column('name_so', sa.String(), nullable=True))
    
    # --- SubCategory ---
    op.alter_column('subcategory', 'name', new_column_name='name_en')
    op.add_column('subcategory', sa.Column('name_so', sa.String(), nullable=True))
    
    # --- SubSubCategory ---
    op.alter_column('subsubcategory', 'name', new_column_name='name_en')
    op.add_column('subsubcategory', sa.Column('name_so', sa.String(), nullable=True))
    
    # --- Listing ---
    op.alter_column('listing', 'title', new_column_name='title_en')
    op.add_column('listing', sa.Column('title_so', sa.String(), nullable=True))
    op.alter_column('listing', 'description', new_column_name='description_en')
    op.add_column('listing', sa.Column('description_so', sa.String(), nullable=True))
    op.add_column('listing', sa.Column('lang_available', sa.String(), nullable=False, server_default='en'))
    
    # --- PromotionPlan ---
    op.alter_column('promotionplan', 'name', new_column_name='name_en')
    op.add_column('promotionplan', sa.Column('name_so', sa.String(), nullable=True))
    op.alter_column('promotionplan', 'description', new_column_name='description_en')
    op.add_column('promotionplan', sa.Column('description_so', sa.String(), nullable=True))

def downgrade():
    # --- PromotionPlan ---
    op.alter_column('promotionplan', 'description_en', new_column_name='description')
    op.drop_column('promotionplan', 'description_so')
    op.alter_column('promotionplan', 'name_en', new_column_name='name')
    op.drop_column('promotionplan', 'name_so')
    
    # --- Listing ---
    op.drop_column('listing', 'lang_available')
    op.drop_column('listing', 'description_so')
    op.alter_column('listing', 'description_en', new_column_name='description')
    op.drop_column('listing', 'title_so')
    op.alter_column('listing', 'title_en', new_column_name='title')
    
    # --- SubSubCategory ---
    op.drop_column('subsubcategory', 'name_so')
    op.alter_column('subsubcategory', 'name_en', new_column_name='name')
    
    # --- SubCategory ---
    op.drop_column('subcategory', 'name_so')
    op.alter_column('subcategory', 'name_en', new_column_name='name')
    
    # --- Category ---
    op.drop_column('category', 'name_so')
    op.alter_column('category', 'name_en', new_column_name='name')
