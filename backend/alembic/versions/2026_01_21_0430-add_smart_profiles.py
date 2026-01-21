"""add smart apartment profiles

Revision ID: add_smart_profiles
Revises: ef403d36ce97
Create Date: 2026-01-21 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_smart_profiles'
down_revision = 'ef403d36ce97'
branch_labels = None
depends_on = None


def upgrade():
    # Create apartment_profiles table
    op.create_table(
        'apartment_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('profile_key', sa.String(), nullable=False),
        sa.Column('apartment_size', sa.String(), nullable=False),
        sa.Column('household_type', sa.String(), nullable=False),
        sa.Column('furnishing_level', sa.String(), nullable=False),
        sa.Column('persona_description', sa.String(), nullable=True),
        sa.Column('typical_volume_min', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('typical_volume_max', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('typical_boxes', sa.Integer(), nullable=False),
        sa.Column('confidence_score', sa.Float(), nullable=True, server_default='0.85'),
        sa.Column('usage_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('accuracy_rating', sa.Float(), nullable=True, server_default='0.90'),
        sa.Column('typical_items', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('common_additions', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('ix_apartment_profiles_profile_key', 'apartment_profiles', ['profile_key'], unique=True)
    op.create_index('ix_apartment_profiles_apartment_size', 'apartment_profiles', ['apartment_size'], unique=False)
    op.create_index('ix_apartment_profiles_household_type', 'apartment_profiles', ['household_type'], unique=False)


def downgrade():
    op.drop_index('ix_apartment_profiles_household_type', table_name='apartment_profiles')
    op.drop_index('ix_apartment_profiles_apartment_size', table_name='apartment_profiles')
    op.drop_index('ix_apartment_profiles_profile_key', table_name='apartment_profiles')
    op.drop_table('apartment_profiles')
