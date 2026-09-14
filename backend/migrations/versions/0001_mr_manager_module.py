"""MR Manager module — pharma companies, medical reps, meeting slots, appointments, visit logs

Revision ID: a3f8c1d92e74
Revises: None
Create Date: 2026-04-23 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# ---------------------------------------------------------------------------
revision = "a3f8c1d92e74"
down_revision = None          # change to your latest revision if chaining
branch_labels = None
depends_on = None
# ---------------------------------------------------------------------------


def upgrade() -> None:
    # ── 1. pharma_companies ─────────────────────────────────────────────────
    # Master list shared across clinics; normalised_name enables dedup.
    op.create_table(
        "pharma_companies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("normalized_name", sa.String(200), nullable=False),   # lowercase strip
        sa.Column("logo_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.UniqueConstraint("name", name="uq_pharma_companies_name"),
    )

    # ── 2. medical_representatives ──────────────────────────────────────────
    op.create_table(
        "medical_representatives",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),

        # Clinic scope
        sa.Column("clinic_id", sa.Integer(), nullable=False),

        # Identity
        sa.Column("full_name", sa.String(150), nullable=False),
        sa.Column("phone", sa.String(15), nullable=False),
        sa.Column("email", sa.String(150), nullable=True),

        # Company linkage — free-text kept even when FK is set for resilience
        sa.Column("company_name", sa.String(200), nullable=False),
        sa.Column(
            "company_id",
            sa.Integer(),
            sa.ForeignKey("pharma_companies.id", ondelete="SET NULL"),
            nullable=True,
        ),

        # Profile
        sa.Column("designation", sa.String(100), nullable=True),
        sa.Column("territory", sa.String(200), nullable=True),
        sa.Column("visiting_card_url", sa.Text(), nullable=True),
        sa.Column("profile_photo_url", sa.Text(), nullable=True),

        # Products this MR represents (free-text tags)
        sa.Column(
            "products_represented",
            postgresql.ARRAY(sa.Text()),
            nullable=True,
        ),

        # Status
        sa.Column(
            "status",
            sa.String(20),
            server_default=sa.text("'active'"),
            nullable=False,
        ),   # active | blocked

        # Aggregates — updated by triggers / application layer
        sa.Column("total_visits", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("avg_rating", sa.Numeric(3, 2), nullable=True),
        sa.Column("last_visit_at", sa.TIMESTAMP(timezone=False), nullable=True),

        # Block metadata
        sa.Column("blocked_reason", sa.Text(), nullable=True),

        # Doctor's private notes (not visible to MR)
        sa.Column("notes", sa.Text(), nullable=True),

        # Audit
        sa.Column("added_by", sa.Integer(), nullable=True),   # user_id
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),

        # Constraints
        sa.UniqueConstraint("clinic_id", "phone", name="uq_mr_clinic_phone"),
        sa.CheckConstraint("status IN ('active', 'blocked')", name="ck_mr_status"),
    )

    # ── 3. mr_meeting_hours ─────────────────────────────────────────────────
    # Per-doctor slot configuration for MR visits.
    op.create_table(
        "mr_meeting_hours",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("clinic_id", sa.Integer(), nullable=False),

        # 0 = Monday … 6 = Sunday
        sa.Column("day_of_week", sa.Integer(), nullable=False),

        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),

        sa.Column(
            "slot_duration_minutes",
            sa.Integer(),
            server_default=sa.text("10"),
            nullable=False,
        ),
        sa.Column(
            "max_mrs_per_slot",
            sa.Integer(),
            server_default=sa.text("1"),
            nullable=False,
        ),
        sa.Column(
            "is_active",
            sa.Boolean(),
            server_default=sa.text("TRUE"),
            nullable=False,
        ),

        sa.CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_mr_meeting_hours_day"),
        sa.CheckConstraint("end_time > start_time",         name="ck_mr_meeting_hours_times"),
        sa.CheckConstraint("slot_duration_minutes > 0",     name="ck_mr_slot_duration_pos"),
        sa.CheckConstraint("max_mrs_per_slot > 0",          name="ck_mr_max_per_slot_pos"),
    )

    # ── 4. mr_appointments ─────────────────────────────────────────────────
    op.create_table(
        "mr_appointments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("clinic_id", sa.Integer(), nullable=False),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column(
            "mr_id",
            sa.Integer(),
            sa.ForeignKey("medical_representatives.id", ondelete="CASCADE"),
            nullable=False,
        ),

        # Scheduling
        sa.Column("scheduled_date", sa.Date(), nullable=False),
        sa.Column("scheduled_time", sa.Time(), nullable=False),
        sa.Column(
            "duration_minutes",
            sa.Integer(),
            server_default=sa.text("10"),
            nullable=False,
        ),

        # Lifecycle
        sa.Column(
            "status",
            sa.String(20),
            server_default=sa.text("'scheduled'"),
            nullable=False,
        ),   # scheduled | in_progress | completed | cancelled | no_show
        sa.Column("booking_method", sa.String(20), nullable=True),   # receptionist | whatsapp

        # Context
        sa.Column("purpose", sa.Text(), nullable=True),

        # Actual meeting timestamps (filled when status changes)
        sa.Column("meeting_started_at", sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("meeting_ended_at",   sa.TIMESTAMP(timezone=False), nullable=True),
        sa.Column("actual_duration_seconds", sa.Integer(), nullable=True),

        # Cancellation
        sa.Column("cancelled_reason", sa.Text(), nullable=True),

        # Audit
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),

        sa.CheckConstraint(
            "status IN ('scheduled','in_progress','completed','cancelled','no_show')",
            name="ck_mr_appt_status",
        ),
        sa.CheckConstraint(
            "booking_method IN ('receptionist','whatsapp') OR booking_method IS NULL",
            name="ck_mr_appt_booking_method",
        ),
    )

    # ── 5. mr_visit_logs ────────────────────────────────────────────────────
    # Rich post-visit data captured by the doctor / receptionist.
    op.create_table(
        "mr_visit_logs",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "appointment_id",
            sa.Integer(),
            sa.ForeignKey("mr_appointments.id", ondelete="SET NULL"),
            nullable=True,   # nullable: walk-ins have no prior appointment
        ),
        sa.Column(
            "mr_id",
            sa.Integer(),
            sa.ForeignKey("medical_representatives.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("doctor_id", sa.Integer(), nullable=False),
        sa.Column("clinic_id", sa.Integer(), nullable=False),
        sa.Column("visit_date", sa.Date(), nullable=False),

        # Products & materials
        sa.Column(
            "products_discussed",
            postgresql.ARRAY(sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "samples_given",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),   # e.g. [{"medicine": "Dolo 650", "quantity": 20}]
        sa.Column(
            "brochures_given",
            sa.Boolean(),
            server_default=sa.text("FALSE"),
            nullable=False,
        ),
        sa.Column(
            "gifts_given",
            postgresql.ARRAY(sa.Text()),
            nullable=True,
        ),

        # Doctor's assessment
        sa.Column("doctor_rating", sa.Integer(), nullable=True),
        sa.Column(
            "doctor_tags",
            postgresql.ARRAY(sa.Text()),
            nullable=True,
        ),   # e.g. ["professional", "pushy"]
        sa.Column("doctor_voice_note_url", sa.Text(), nullable=True),
        sa.Column("doctor_notes", sa.Text(), nullable=True),

        # Follow-up
        sa.Column(
            "follow_up_required",
            sa.Boolean(),
            server_default=sa.text("FALSE"),
            nullable=False,
        ),
        sa.Column("follow_up_date", sa.Date(), nullable=True),

        # Audit
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=False),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),

        sa.CheckConstraint(
            "doctor_rating BETWEEN 1 AND 5 OR doctor_rating IS NULL",
            name="ck_mr_visit_rating",
        ),
    )

    # ── Indexes ─────────────────────────────────────────────────────────────

    # medical_representatives
    op.create_index("ix_mr_clinic_id",        "medical_representatives", ["clinic_id"])
    op.create_index("ix_mr_status",           "medical_representatives", ["status"])
    op.create_index("ix_mr_phone",            "medical_representatives", ["phone"])
    op.create_index("ix_mr_clinic_status",    "medical_representatives", ["clinic_id", "status"])

    # mr_appointments
    op.create_index("ix_mra_clinic_date",     "mr_appointments", ["clinic_id", "scheduled_date"])
    op.create_index("ix_mra_status",          "mr_appointments", ["status"])
    op.create_index("ix_mra_mr_id",           "mr_appointments", ["mr_id"])
    op.create_index("ix_mra_doctor_date",     "mr_appointments", ["doctor_id", "scheduled_date"])

    # mr_visit_logs — descending date for "latest visits" queries
    op.create_index(
        "ix_mrvl_mr_visit_date",
        "mr_visit_logs",
        ["mr_id", sa.text("visit_date DESC")],
        postgresql_using="btree",
    )
    op.create_index(
        "ix_mrvl_doctor_visit_date",
        "mr_visit_logs",
        ["doctor_id", sa.text("visit_date DESC")],
        postgresql_using="btree",
    )


def downgrade() -> None:
    # Drop indexes first
    op.drop_index("ix_mrvl_doctor_visit_date", table_name="mr_visit_logs")
    op.drop_index("ix_mrvl_mr_visit_date",     table_name="mr_visit_logs")
    op.drop_index("ix_mra_doctor_date",        table_name="mr_appointments")
    op.drop_index("ix_mra_mr_id",             table_name="mr_appointments")
    op.drop_index("ix_mra_status",            table_name="mr_appointments")
    op.drop_index("ix_mra_clinic_date",       table_name="mr_appointments")
    op.drop_index("ix_mr_clinic_status",      table_name="medical_representatives")
    op.drop_index("ix_mr_phone",              table_name="medical_representatives")
    op.drop_index("ix_mr_status",            table_name="medical_representatives")
    op.drop_index("ix_mr_clinic_id",         table_name="medical_representatives")

    # Drop tables in reverse FK order
    op.drop_table("mr_visit_logs")
    op.drop_table("mr_appointments")
    op.drop_table("mr_meeting_hours")
    op.drop_table("medical_representatives")
    op.drop_table("pharma_companies")
