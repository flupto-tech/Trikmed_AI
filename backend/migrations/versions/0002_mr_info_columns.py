"""Add missing columns to medical_representatives for mr_info data layer

Revision ID: b7e2d4f01c83
Revises: a3f8c1d92e74
Create Date: 2026-05-01 00:00:00.000000

Run against an existing Supabase project to bring the table in line with
the new store abstraction.  Safe to run multiple times (all ADD COLUMN
statements use IF NOT EXISTS).
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision      = "b7e2d4f01c83"
down_revision = "a3f8c1d92e74"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # All statements use ADD COLUMN IF NOT EXISTS so re-running is safe.
    stmts = [
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS email varchar(255)",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS company_name varchar(200)",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS products_represented text[]",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS visiting_card_url text",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS profile_photo_url text",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS notes text",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS total_visits integer DEFAULT 0",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS avg_rating numeric(3,2)",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS last_visit_at timestamptz",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS added_by text",
        "ALTER TABLE medical_representatives ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW()",
    ]
    conn = op.get_bind()
    for stmt in stmts:
        conn.execute(sa.text(stmt))

    # Back-fill company_name from company where it is NULL
    conn.execute(sa.text(
        "UPDATE medical_representatives SET company_name = company WHERE company_name IS NULL AND company IS NOT NULL"
    ))


def downgrade() -> None:
    # Dropping columns is destructive — only do this in dev/test.
    cols = [
        "email", "company_name", "products_represented", "visiting_card_url",
        "profile_photo_url", "notes", "total_visits", "avg_rating",
        "last_visit_at", "added_by", "updated_at",
    ]
    conn = op.get_bind()
    for col in cols:
        conn.execute(sa.text(f"ALTER TABLE medical_representatives DROP COLUMN IF EXISTS {col}"))
