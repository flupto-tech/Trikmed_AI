"""Production Supabase/PostgreSQL schema V2.

Revision ID: c1f4a7b9d203
Revises: b7e2d4f01c83
Create Date: 2026-07-19 00:00:00.000000

This migration intentionally replaces the prototype schema. It is destructive
and is meant for the pre-production Supabase cutover.
"""

from __future__ import annotations

from pathlib import Path

from alembic import op


revision = "c1f4a7b9d203"
down_revision = "b7e2d4f01c83"
branch_labels = None
depends_on = None


def upgrade() -> None:
    schema_path = Path(__file__).resolve().parents[2] / "supabase_schema.sql"
    sql = schema_path.read_text(encoding="utf-8").strip()
    if sql.lower().startswith("begin;"):
        sql = sql[6:].strip()
    if sql.lower().endswith("commit;"):
        sql = sql[:-7].strip()
    op.get_bind().exec_driver_sql(sql)


def downgrade() -> None:
    table_names = [
        "doctor_medicine_prefs",
        "medicine_aliases",
        "medicines",
        "mr_samples",
        "mr_visits",
        "medical_representatives",
        "demo_requests",
        "audit_logs",
        "files",
        "webhook_events",
        "reminder_jobs",
        "conversation_messages",
        "conversation_sessions",
        "whatsapp_numbers",
        "booking_links",
        "prescription_medicines",
        "prescriptions",
        "medical_records",
        "patient_payment_refunds",
        "patient_payments",
        "subscription_payments",
        "subscription_invoice_items",
        "subscription_invoices",
        "clinic_subscriptions",
        "billing_products",
        "appointment_vitals",
        "appointments",
        "patients",
        "clinic_doctors",
        "clinic_settings",
        "clinic_memberships",
        "clinics",
        "user_profiles",
    ]
    conn = op.get_bind()
    conn.exec_driver_sql("create schema if not exists legacy_json_migration")
    conn.exec_driver_sql(
        """
        create or replace function public.archive_public_table_for_v2(table_name text)
        returns void
        language plpgsql
        as $$
        declare
          archived_name text;
        begin
          if to_regclass(format('public.%I', table_name)) is null then
            return;
          end if;

          archived_name := table_name || '_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
          execute format('alter table public.%I rename to %I', table_name, archived_name);
          execute format('alter table public.%I set schema legacy_json_migration', archived_name);
        end;
        $$;
        """
    )
    for table_name in table_names:
        conn.exec_driver_sql(f"select public.archive_public_table_for_v2('{table_name}')")
