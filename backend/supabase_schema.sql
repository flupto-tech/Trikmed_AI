begin;

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists citext;
create extension if not exists unaccent;

create schema if not exists legacy_json_migration;

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

select public.archive_public_table_for_v2('consent_logs');
select public.archive_public_table_for_v2('doctor_medicine_prefs');
select public.archive_public_table_for_v2('medicine_aliases');
select public.archive_public_table_for_v2('medicines');
select public.archive_public_table_for_v2('missed_calls');
select public.archive_public_table_for_v2('clinic_qr_codes');
select public.archive_public_table_for_v2('booking_links');
select public.archive_public_table_for_v2('mr_samples');
select public.archive_public_table_for_v2('mr_visits');
select public.archive_public_table_for_v2('medical_representatives');
select public.archive_public_table_for_v2('demo_requests');
select public.archive_public_table_for_v2('activity_log');
select public.archive_public_table_for_v2('reminder_log');
select public.archive_public_table_for_v2('reminder_templates');
select public.archive_public_table_for_v2('whatsapp_messages');
select public.archive_public_table_for_v2('whatsapp_conversations');
select public.archive_public_table_for_v2('prescription_medicines');
select public.archive_public_table_for_v2('prescriptions');
select public.archive_public_table_for_v2('subscription_payments');
select public.archive_public_table_for_v2('subscription_invoice_items');
select public.archive_public_table_for_v2('subscription_invoices');
select public.archive_public_table_for_v2('clinic_subscriptions');
select public.archive_public_table_for_v2('billing_products');
select public.archive_public_table_for_v2('patient_payment_refunds');
select public.archive_public_table_for_v2('patient_payments');
select public.archive_public_table_for_v2('payments');
select public.archive_public_table_for_v2('vitals');
select public.archive_public_table_for_v2('appointments');
select public.archive_public_table_for_v2('patients');
select public.archive_public_table_for_v2('clinic_staff');
select public.archive_public_table_for_v2('clinic_settings');
select public.archive_public_table_for_v2('clinics');
select public.archive_public_table_for_v2('platform_staff');
select public.archive_public_table_for_v2('cities');
select public.archive_public_table_for_v2('zones');
select public.archive_public_table_for_v2('app_users');
select public.archive_public_table_for_v2('audit_logs');
select public.archive_public_table_for_v2('files');
select public.archive_public_table_for_v2('webhook_events');
select public.archive_public_table_for_v2('conversation_messages');
select public.archive_public_table_for_v2('conversation_sessions');
select public.archive_public_table_for_v2('reminder_jobs');
select public.archive_public_table_for_v2('whatsapp_numbers');
select public.archive_public_table_for_v2('medical_records');
select public.archive_public_table_for_v2('appointment_vitals');
select public.archive_public_table_for_v2('clinic_doctors');
select public.archive_public_table_for_v2('clinic_memberships');
select public.archive_public_table_for_v2('user_profiles');

drop type if exists public.audit_action;
drop type if exists public.billing_interval;
drop type if exists public.billing_product_type;
drop type if exists public.booking_link_type;
drop type if exists public.booking_source;
drop type if exists public.clinic_plan;
drop type if exists public.clinic_role;
drop type if exists public.clinic_status;
drop type if exists public.conversation_status;
drop type if exists public.demo_request_status;
drop type if exists public.file_resource_type;
drop type if exists public.gender_type;
drop type if exists public.medical_record_type;
drop type if exists public.message_delivery_status;
drop type if exists public.message_direction;
drop type if exists public.message_type;
drop type if exists public.mr_status;
drop type if exists public.mr_visit_status;
drop type if exists public.notification_channel;
drop type if exists public.patient_payment_category;
drop type if exists public.payment_mode;
drop type if exists public.payment_status;
drop type if exists public.platform_role;
drop type if exists public.prescription_status;
drop type if exists public.queue_status;
drop type if exists public.reminder_status;
drop type if exists public.saas_invoice_status;
drop type if exists public.saas_payment_method;
drop type if exists public.saas_payment_status;
drop type if exists public.subscription_status;
drop type if exists public.visit_type;
drop type if exists public.appointment_status;
drop type if exists public.whatsapp_number_type;

create type public.clinic_plan as enum ('free', 'basic', 'growth', 'pro', 'premium', 'enterprise');
create type public.clinic_status as enum ('pending_setup', 'pending_approval', 'trial', 'approved', 'active', 'suspended', 'rejected', 'archived');
create type public.platform_role as enum ('super', 'zone', 'city', 'sales', 'mr', 'installer', 'hr', 'support');
create type public.clinic_role as enum ('doctor_owner', 'owner', 'doctor', 'receptionist', 'staff');
create type public.gender_type as enum ('male', 'female', 'other', 'unknown');
create type public.booking_source as enum ('dashboard', 'walkin', 'qr', 'website', 'whatsapp', 'phone', 'nfc', 'import');
create type public.visit_type as enum ('new', 'followup', 'free', 'custom', 'emergency');
create type public.appointment_status as enum ('booked', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show', 'awaiting_reports');
create type public.queue_status as enum ('none', 'booked', 'paid', 'vitals_done', 'in_cabin', 'completed', 'cancelled', 'no_show', 'awaiting_reports');
create type public.payment_status as enum ('pending', 'paid', 'free', 'failed', 'refunded', 'cancelled');
create type public.payment_mode as enum ('cash', 'upi', 'card', 'online', 'waived', 'skip');
create type public.patient_payment_category as enum ('consultation', 'walkin', 'online_booking', 'procedure', 'pharmacy', 'lab', 'other');
create type public.billing_product_type as enum ('base_plan', 'premium_whatsapp', 'ai_addon', 'other_addon');
create type public.billing_interval as enum ('monthly', 'quarterly', 'yearly', 'one_time');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'cancelled', 'expired');
create type public.saas_invoice_status as enum ('draft', 'issued', 'paid', 'void', 'overdue');
create type public.saas_payment_status as enum ('pending', 'paid', 'failed', 'refunded', 'cancelled');
create type public.saas_payment_method as enum ('upi', 'card', 'bank_transfer', 'gateway', 'cash');
create type public.prescription_status as enum ('draft', 'finalized', 'sent', 'voided');
create type public.booking_link_type as enum ('qr', 'website', 'nfc', 'campaign', 'manual');
create type public.whatsapp_number_type as enum ('shared_trikmed', 'clinic_owned');
create type public.conversation_status as enum ('active', 'waiting_for_patient', 'waiting_for_staff', 'completed', 'cancelled', 'expired', 'archived');
create type public.demo_request_status as enum ('new', 'contacted', 'converted', 'closed');
create type public.message_direction as enum ('incoming', 'outgoing');
create type public.message_type as enum ('text', 'image', 'audio', 'video', 'document', 'template', 'interactive', 'system');
create type public.message_delivery_status as enum ('queued', 'sent', 'delivered', 'read', 'failed');
create type public.reminder_status as enum ('pending', 'scheduled', 'sent', 'failed', 'cancelled', 'skipped');
create type public.mr_status as enum ('active', 'blocked', 'archived');
create type public.mr_visit_status as enum ('pending', 'checked_in', 'completed', 'cancelled', 'no_show');
create type public.medical_record_type as enum ('consultation', 'lab_report', 'imaging', 'note', 'history', 'allergy', 'diagnosis');
create type public.notification_channel as enum ('whatsapp', 'sms', 'email');
create type public.file_resource_type as enum ('clinic', 'doctor', 'patient', 'appointment', 'prescription', 'mr', 'payment', 'message', 'other');
create type public.audit_action as enum ('create', 'update', 'delete', 'login', 'logout', 'approve', 'reject', 'send', 'download', 'void');

create table public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email citext unique,
  password_hash text,
  pin_hash text,
  full_name text not null,
  phone_e164 text,
  platform_role public.platform_role,
  zone text,
  city text,
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint user_profiles_phone_format check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint user_profiles_auth_or_password check (auth_user_id is not null or password_hash is not null or pin_hash is not null)
);

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  clinic_code text not null unique,
  name text not null,
  legal_name text,
  primary_doctor_name text,
  primary_phone_e164 text,
  whatsapp_phone_e164 text,
  email citext,
  address_line1 text,
  address_line2 text,
  city text,
  zone text,
  state text,
  pincode text,
  gstin text,
  registration_number text,
  website text,
  logo_file_id uuid,
  plan public.clinic_plan not null default 'free',
  monthly_recurring_revenue numeric(10,2) not null default 0 check (monthly_recurring_revenue >= 0),
  status public.clinic_status not null default 'pending_approval',
  onboarding_notes text,
  approved_by uuid references public.user_profiles(id) on delete set null,
  approved_at timestamptz,
  rejected_by uuid references public.user_profiles(id) on delete set null,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint clinics_code_format check (clinic_code ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'),
  constraint clinics_primary_phone_format check (primary_phone_e164 is null or primary_phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint clinics_whatsapp_phone_format check (whatsapp_phone_e164 is null or whatsapp_phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table public.clinic_memberships (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  user_id uuid not null references public.user_profiles(id) on delete restrict,
  role public.clinic_role not null,
  permissions jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, user_id)
);

create table public.clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null unique references public.clinics(id) on delete restrict,
  cabin_mode text not null default 'single' check (cabin_mode in ('single', 'parallel')),
  paper_size text not null default 'A5' check (paper_size in ('A4', 'A5')),
  default_followup_days integer not null default 7 check (default_followup_days >= 0),
  instruction_language text not null default 'both' check (instruction_language in ('en', 'hi', 'both')),
  show_letterhead boolean not null default true,
  show_qr_verify boolean not null default true,
  whatsapp_share boolean not null default true,
  reminder_enabled boolean not null default true,
  reminder_minutes_before integer not null default 120 check (reminder_minutes_before >= 0),
  missed_call_reply_enabled boolean not null default true,
  followup_reminder_enabled boolean not null default true,
  new_patient_fee numeric(10,2) not null default 0 check (new_patient_fee >= 0),
  followup_fee numeric(10,2) not null default 0 check (followup_fee >= 0),
  followup_window_days integer not null default 7 check (followup_window_days >= 0),
  accepted_payments public.payment_mode[] not null default array['cash']::public.payment_mode[],
  upi_id text,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.billing_products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  product_type public.billing_product_type not null,
  billing_interval public.billing_interval not null default 'monthly',
  currency char(3) not null default 'INR',
  default_amount numeric(10,2) not null default 0 check (default_amount >= 0),
  gst_rate numeric(5,2) not null default 0 check (gst_rate >= 0 and gst_rate <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint billing_products_code_format check (product_code ~ '^[A-Z0-9][A-Z0-9_-]{2,63}$'),
  constraint billing_products_currency_format check (currency ~ '^[A-Z]{3}$')
);

create table public.clinic_subscriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  product_id uuid not null references public.billing_products(id) on delete restrict,
  status public.subscription_status not null default 'trialing',
  billing_interval public.billing_interval not null default 'monthly',
  currency char(3) not null default 'INR',
  unit_amount numeric(10,2) not null default 0 check (unit_amount >= 0),
  quantity integer not null default 1 check (quantity > 0),
  started_at timestamptz not null default now(),
  trial_ends_at date,
  current_period_start date,
  current_period_end date,
  grace_period_ends_at date,
  cancelled_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  constraint clinic_subscriptions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint clinic_subscriptions_period_order check (current_period_end is null or current_period_start is null or current_period_end >= current_period_start),
  constraint clinic_subscriptions_trial_order check (trial_ends_at is null or current_period_start is null or trial_ends_at >= current_period_start),
  constraint clinic_subscriptions_grace_order check (grace_period_ends_at is null or current_period_end is null or grace_period_ends_at >= current_period_end),
  constraint clinic_subscriptions_trial_ends_at_required check (status <> 'trialing' or trial_ends_at is not null),
  constraint clinic_subscriptions_current_not_ended check (status not in ('trialing', 'active', 'past_due') or ended_at is null),
  constraint clinic_subscriptions_current_not_cancelled check (status not in ('trialing', 'active', 'past_due') or cancelled_at is null),
  constraint clinic_subscriptions_cancelled_at_required check (status <> 'cancelled' or cancelled_at is not null),
  constraint clinic_subscriptions_ended_at_required check (status <> 'expired' or ended_at is not null)
);

create table public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  invoice_number text not null unique,
  status public.saas_invoice_status not null default 'draft',
  currency char(3) not null default 'INR',
  subtotal_amount numeric(10,2) not null default 0 check (subtotal_amount >= 0),
  tax_amount numeric(10,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  amount_due numeric(10,2) not null default 0 check (amount_due >= 0),
  period_start date,
  period_end date,
  issued_at timestamptz,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  unique (clinic_id, invoice_number),
  constraint subscription_invoices_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint subscription_invoices_total_matches check (total_amount = subtotal_amount + tax_amount),
  constraint subscription_invoices_due_not_above_total check (amount_due <= total_amount),
  constraint subscription_invoices_period_order check (period_end is null or period_start is null or period_end >= period_start),
  constraint subscription_invoices_paid_at_required check (status <> 'paid' or paid_at is not null)
);

create table public.subscription_invoice_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  invoice_id uuid not null,
  product_id uuid references public.billing_products(id) on delete restrict,
  subscription_id uuid,
  description text not null,
  quantity integer not null default 1 check (quantity > 0),
  unit_amount numeric(10,2) not null default 0 check (unit_amount >= 0),
  tax_amount numeric(10,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(10,2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  constraint subscription_invoice_items_total_matches check (total_amount = (quantity * unit_amount) + tax_amount),
  foreign key (clinic_id, invoice_id) references public.subscription_invoices(clinic_id, id) on delete cascade,
  foreign key (clinic_id, subscription_id) references public.clinic_subscriptions(clinic_id, id) on delete restrict
);

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  invoice_id uuid not null,
  currency char(3) not null default 'INR',
  amount numeric(10,2) not null check (amount > 0),
  status public.saas_payment_status not null default 'pending',
  payment_method public.saas_payment_method not null default 'gateway',
  provider_payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  constraint subscription_payments_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint subscription_payments_paid_at_required check (status <> 'paid' or paid_at is not null),
  foreign key (clinic_id, invoice_id) references public.subscription_invoices(clinic_id, id) on delete restrict
);

create table public.clinic_doctors (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  user_id uuid references public.user_profiles(id) on delete set null,
  full_name text not null,
  qualifications text,
  specialty text,
  registration_number text,
  phone_e164 text,
  email citext,
  signature_file_id uuid,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  constraint clinic_doctors_phone_format check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create unique index clinic_doctors_one_primary_per_clinic
  on public.clinic_doctors (clinic_id)
  where is_primary and is_active;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_code text,
  phone_e164 text not null,
  full_name text not null,
  date_of_birth date,
  age_years_reported integer check (age_years_reported is null or age_years_reported between 0 and 130),
  age_recorded_at date,
  gender public.gender_type not null default 'unknown',
  locality text,
  emergency_phone_e164 text,
  blood_group text check (blood_group is null or blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies text[] not null default '{}',
  chronic_conditions text[] not null default '{}',
  doctor_note text,
  whatsapp_opt_in boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  unique (clinic_id, phone_e164),
  unique (clinic_id, patient_code),
  constraint patients_phone_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint patients_emergency_phone_format check (emergency_phone_e164 is null or emergency_phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null,
  doctor_id uuid not null,
  appointment_date date not null,
  appointment_time time,
  token_number integer check (token_number is null or token_number > 0),
  source public.booking_source not null default 'dashboard',
  visit_type public.visit_type not null default 'new',
  appointment_status public.appointment_status not null default 'booked',
  queue_status public.queue_status not null default 'booked',
  chief_complaint text,
  cabin_slot text check (cabin_slot is null or cabin_slot in ('A', 'B', 'C')),
  checked_in_at timestamptz,
  vitals_done_at timestamptz,
  cabin_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  notes text,
  fee_charged numeric(10,2) check (fee_charged is null or fee_charged >= 0),
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  unique (clinic_id, id, patient_id),
  unique (clinic_id, id, patient_id, doctor_id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, doctor_id) references public.clinic_doctors(clinic_id, id) on delete restrict
);

create unique index appointments_token_unique_per_doctor_day
  on public.appointments (clinic_id, doctor_id, appointment_date, token_number)
  where token_number is not null and appointment_status <> 'cancelled';

create table public.appointment_vitals (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null,
  appointment_id uuid not null,
  patient_id uuid not null,
  bp_systolic integer check (bp_systolic is null or bp_systolic between 40 and 260),
  bp_diastolic integer check (bp_diastolic is null or bp_diastolic between 30 and 180),
  pulse integer check (pulse is null or pulse between 20 and 250),
  temperature_c numeric(4,1) check (temperature_c is null or temperature_c between 30 and 45),
  temperature_f numeric(4,1) check (temperature_f is null or temperature_f between 80 and 115),
  weight_kg numeric(5,2) check (weight_kg is null or weight_kg between 0 and 500),
  height_cm numeric(5,2) check (height_cm is null or height_cm between 20 and 260),
  spo2 integer check (spo2 is null or spo2 between 0 and 100),
  blood_sugar_mg_dl integer check (blood_sugar_mg_dl is null or blood_sugar_mg_dl between 20 and 1000),
  notes text,
  recorded_by uuid references public.user_profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  unique (clinic_id, appointment_id),
  foreign key (clinic_id, appointment_id, patient_id) references public.appointments(clinic_id, id, patient_id) on delete cascade,
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict
);

create table public.patient_payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null,
  appointment_id uuid,
  payment_category public.patient_payment_category not null default 'consultation',
  currency char(3) not null default 'INR',
  amount numeric(10,2) not null default 0 check (amount >= 0),
  mode public.payment_mode not null default 'cash',
  status public.payment_status not null default 'pending',
  consultation_type public.visit_type not null default 'new',
  provider_transaction_id text,
  received_by uuid references public.user_profiles(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  constraint patient_payments_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint patient_payments_paid_at_required check (status <> 'paid' or paid_at is not null),
  constraint patient_payments_amount_status check (
    (status = 'free' and amount = 0) or
    (status <> 'paid' or amount > 0 or mode = 'waived')
  ),
  constraint patient_payments_patient_required_for_appointment check (appointment_id is null or patient_id is not null),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, appointment_id, patient_id) references public.appointments(clinic_id, id, patient_id) on delete restrict
);

create table public.patient_payment_refunds (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  payment_id uuid not null,
  currency char(3) not null default 'INR',
  amount numeric(10,2) not null check (amount > 0),
  mode public.payment_mode not null default 'online',
  status public.payment_status not null default 'pending',
  reason text,
  provider_refund_id text,
  refunded_by uuid references public.user_profiles(id) on delete set null,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  constraint patient_payment_refunds_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint patient_payment_refunds_refunded_at_required check (status <> 'refunded' or refunded_at is not null),
  foreign key (clinic_id, payment_id) references public.patient_payments(clinic_id, id) on delete restrict
);

create table public.medical_records (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null,
  appointment_id uuid,
  record_type public.medical_record_type not null,
  title text not null,
  summary text,
  recorded_by uuid references public.user_profiles(id) on delete set null,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, appointment_id, patient_id) references public.appointments(clinic_id, id, patient_id) on delete restrict
);

create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid not null,
  doctor_id uuid not null,
  appointment_id uuid,
  rx_number text not null,
  status public.prescription_status not null default 'draft',
  diagnosis text[] not null default '{}',
  symptoms text[] not null default '{}',
  tests_ordered text[] not null default '{}',
  instructions jsonb not null default '{}'::jsonb,
  follow_up_date date,
  doctor_note text,
  pdf_file_id uuid,
  voice_transcript text,
  voice_provider text,
  finalized_at timestamptz,
  voided_at timestamptz,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  unique (clinic_id, id, patient_id),
  unique (clinic_id, rx_number),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, doctor_id) references public.clinic_doctors(clinic_id, id) on delete restrict,
  foreign key (clinic_id, appointment_id, patient_id, doctor_id) references public.appointments(clinic_id, id, patient_id, doctor_id) on delete restrict
);

create table public.prescription_medicines (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  prescription_id uuid not null,
  medicine_name text not null,
  generic_name text,
  strength text,
  dosage text,
  frequency_code text,
  frequency_label text,
  timing text,
  duration_days integer check (duration_days is null or duration_days >= 0),
  duration_label text,
  quantity integer check (quantity is null or quantity >= 0),
  instructions text,
  sort_order integer not null default 0,
  foreign key (clinic_id, prescription_id) references public.prescriptions(clinic_id, id) on delete cascade
);

create table public.booking_links (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  doctor_id uuid,
  code text not null unique,
  link_type public.booking_link_type not null default 'qr',
  source_label text,
  destination_url text,
  is_active boolean not null default true,
  created_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  foreign key (clinic_id, doctor_id) references public.clinic_doctors(clinic_id, id) on delete restrict,
  constraint booking_links_code_format check (code ~ '^[A-Z0-9][A-Z0-9_-]{5,63}$')
);

create table public.whatsapp_numbers (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete restrict,
  number_type public.whatsapp_number_type not null,
  phone_e164 text not null unique,
  provider text not null default 'meta',
  provider_phone_number_id text unique,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint whatsapp_numbers_phone_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint whatsapp_numbers_shared_has_no_clinic check (
    (number_type = 'shared_trikmed' and clinic_id is null)
    or (number_type = 'clinic_owned' and clinic_id is not null)
  )
);

create table public.conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid,
  whatsapp_number_id uuid not null references public.whatsapp_numbers(id) on delete restrict,
  contact_phone_e164 text not null,
  status public.conversation_status not null default 'active',
  current_step text,
  appointment_id uuid,
  booking_link_id uuid,
  ai_context jsonb not null default '{}'::jsonb,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, id),
  constraint conversation_sessions_patient_required_for_appointment check (appointment_id is null or patient_id is not null),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, appointment_id, patient_id) references public.appointments(clinic_id, id, patient_id) on delete restrict,
  foreign key (clinic_id, booking_link_id) references public.booking_links(clinic_id, id) on delete restrict,
  constraint conversation_sessions_contact_phone_format check (contact_phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  session_id uuid not null,
  direction public.message_direction not null,
  provider_message_id text unique,
  message_type public.message_type not null default 'text',
  body text,
  template_name text,
  status public.message_delivery_status,
  ai_metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (clinic_id, session_id) references public.conversation_sessions(clinic_id, id) on delete cascade
);

create table public.reminder_jobs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid,
  appointment_id uuid,
  prescription_id uuid,
  channel public.notification_channel not null,
  status public.reminder_status not null default 'pending',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reminder_jobs_patient_required_for_resources check (
    (appointment_id is null and prescription_id is null) or patient_id is not null
  ),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict,
  foreign key (clinic_id, appointment_id, patient_id) references public.appointments(clinic_id, id, patient_id) on delete cascade,
  foreign key (clinic_id, prescription_id, patient_id) references public.prescriptions(clinic_id, id, patient_id) on delete cascade
);

create table public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text,
  event_type text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  failed_at timestamptz,
  error_message text,
  payload jsonb not null,
  unique (provider, provider_event_id)
);

create table public.files (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  patient_id uuid,
  bucket text not null,
  object_path text not null,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  resource_type public.file_resource_type not null default 'other',
  resource_id uuid,
  uploaded_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (clinic_id, id),
  unique (bucket, object_path),
  foreign key (clinic_id, patient_id) references public.patients(clinic_id, id) on delete restrict
);

alter table public.clinics
  add constraint clinics_logo_file_id_fkey foreign key (id, logo_file_id) references public.files(clinic_id, id) on delete restrict deferrable initially deferred;
alter table public.clinic_doctors
  add constraint clinic_doctors_signature_file_id_fkey foreign key (clinic_id, signature_file_id) references public.files(clinic_id, id) on delete restrict deferrable initially deferred;
alter table public.prescriptions
  add constraint prescriptions_pdf_file_id_fkey foreign key (clinic_id, pdf_file_id) references public.files(clinic_id, id) on delete restrict deferrable initially deferred;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references public.clinics(id) on delete restrict,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  action public.audit_action not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.demo_requests (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null,
  doctor_name text,
  specialty text,
  phone_e164 text not null,
  city text,
  status public.demo_request_status not null default 'new',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint demo_requests_phone_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$')
);

create table public.medical_representatives (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  full_name text not null,
  phone_e164 text not null,
  email citext,
  company_name text not null,
  designation text,
  territory text,
  products_represented text[] not null default '{}',
  visiting_card_file_id uuid,
  profile_photo_file_id uuid,
  notes text,
  status public.mr_status not null default 'active',
  blocked_reason text,
  total_visits integer not null default 0 check (total_visits >= 0),
  avg_rating numeric(3,2) check (avg_rating is null or avg_rating between 1 and 5),
  last_visit_at timestamptz,
  added_by uuid references public.user_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (clinic_id, id),
  unique (clinic_id, phone_e164),
  foreign key (clinic_id, visiting_card_file_id) references public.files(clinic_id, id) on delete restrict,
  foreign key (clinic_id, profile_photo_file_id) references public.files(clinic_id, id) on delete restrict,
  constraint medical_representatives_phone_format check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  constraint medical_representatives_block_reason check (status <> 'blocked' or nullif(trim(blocked_reason), '') is not null)
);

create table public.mr_visits (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  mr_id uuid not null,
  doctor_id uuid,
  visit_date date not null,
  check_in_time timestamptz,
  check_out_time timestamptz,
  purpose text,
  visit_proof_file_id uuid,
  status public.mr_visit_status not null default 'pending',
  notes text,
  rating integer check (rating is null or rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (clinic_id, id),
  foreign key (clinic_id, visit_proof_file_id) references public.files(clinic_id, id) on delete restrict,
  foreign key (clinic_id, mr_id) references public.medical_representatives(clinic_id, id) on delete restrict,
  foreign key (clinic_id, doctor_id) references public.clinic_doctors(clinic_id, id) on delete restrict
);

create table public.mr_samples (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  visit_id uuid not null,
  medicine_name text not null,
  quantity integer not null check (quantity > 0),
  batch_number text,
  expiry_date date,
  acknowledged boolean not null default false,
  acknowledged_at timestamptz,
  foreign key (clinic_id, visit_id) references public.mr_visits(clinic_id, id) on delete cascade
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  generic_name text,
  manufacturer text,
  category text,
  dosage_forms text[] not null default '{}',
  common_doses text[] not null default '{}',
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(brand_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(generic_name, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(manufacturer, '')), 'C')
  ) stored,
  created_at timestamptz not null default now()
);

create table public.medicine_aliases (
  id uuid primary key default gen_random_uuid(),
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  alias text not null,
  source text not null default 'manual' check (source in ('manual', 'import', 'ai')),
  unique (medicine_id, alias)
);

create table public.doctor_medicine_prefs (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete restrict,
  doctor_id uuid not null,
  medicine_id uuid not null references public.medicines(id) on delete restrict,
  use_count integer not null default 1 check (use_count > 0),
  last_used_at timestamptz not null default now(),
  unique (clinic_id, doctor_id, medicine_id),
  foreign key (clinic_id, doctor_id) references public.clinic_doctors(clinic_id, id) on delete cascade
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
create trigger set_clinics_updated_at before update on public.clinics for each row execute function public.set_updated_at();
create trigger set_clinic_memberships_updated_at before update on public.clinic_memberships for each row execute function public.set_updated_at();
create trigger set_billing_products_updated_at before update on public.billing_products for each row execute function public.set_updated_at();
create trigger set_clinic_subscriptions_updated_at before update on public.clinic_subscriptions for each row execute function public.set_updated_at();
create trigger set_subscription_invoices_updated_at before update on public.subscription_invoices for each row execute function public.set_updated_at();
create trigger set_subscription_payments_updated_at before update on public.subscription_payments for each row execute function public.set_updated_at();
create trigger set_clinic_doctors_updated_at before update on public.clinic_doctors for each row execute function public.set_updated_at();
create trigger set_patients_updated_at before update on public.patients for each row execute function public.set_updated_at();
create trigger set_appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger set_patient_payments_updated_at before update on public.patient_payments for each row execute function public.set_updated_at();
create trigger set_prescriptions_updated_at before update on public.prescriptions for each row execute function public.set_updated_at();
create trigger set_booking_links_updated_at before update on public.booking_links for each row execute function public.set_updated_at();
create trigger set_whatsapp_numbers_updated_at before update on public.whatsapp_numbers for each row execute function public.set_updated_at();
create trigger set_conversation_sessions_updated_at before update on public.conversation_sessions for each row execute function public.set_updated_at();
create trigger set_reminder_jobs_updated_at before update on public.reminder_jobs for each row execute function public.set_updated_at();
create trigger set_medical_representatives_updated_at before update on public.medical_representatives for each row execute function public.set_updated_at();

create or replace function public.enforce_conversation_whatsapp_number_scope()
returns trigger
language plpgsql
as $$
declare
  number_clinic_id uuid;
  number_type public.whatsapp_number_type;
begin
  select wn.clinic_id, wn.number_type
    into number_clinic_id, number_type
  from public.whatsapp_numbers wn
  where wn.id = new.whatsapp_number_id;

  if number_type = 'clinic_owned' and number_clinic_id is distinct from new.clinic_id then
    raise exception 'Clinic-owned WhatsApp number % does not belong to clinic %', new.whatsapp_number_id, new.clinic_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_conversation_whatsapp_number_scope
  before insert or update of clinic_id, whatsapp_number_id on public.conversation_sessions
  for each row execute function public.enforce_conversation_whatsapp_number_scope();

create or replace function public.enforce_patient_payment_integrity()
returns trigger
language plpgsql
as $$
declare
  appointment_fee numeric(10,2);
  appointment_status_value public.appointment_status;
  payment_total numeric(10,2);
begin
  if new.appointment_id is null or new.status in ('failed', 'cancelled', 'refunded') then
    return new;
  end if;

  select a.fee_charged, a.appointment_status
    into appointment_fee, appointment_status_value
  from public.appointments a
  where a.clinic_id = new.clinic_id
    and a.id = new.appointment_id
    and a.patient_id = new.patient_id
  for update;

  if appointment_status_value in ('cancelled', 'no_show') then
    raise exception 'Cannot collect payment against % appointment %', appointment_status_value, new.appointment_id
      using errcode = '23514';
  end if;

  if appointment_fee is not null then
    select coalesce(sum(pp.amount), 0)
      into payment_total
    from public.patient_payments pp
    where pp.clinic_id = new.clinic_id
      and pp.appointment_id = new.appointment_id
      and pp.id is distinct from new.id
      and pp.status not in ('failed', 'cancelled', 'refunded');

    if payment_total + new.amount > appointment_fee then
      raise exception 'Patient payment total exceeds appointment fee %', new.appointment_id
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_patient_payment_integrity
  before insert or update of amount, status, clinic_id, patient_id, appointment_id on public.patient_payments
  for each row execute function public.enforce_patient_payment_integrity();

create or replace function public.prevent_settled_patient_payment_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('paid', 'free', 'refunded') then
    raise exception 'Cannot delete settled patient payment %', old.id
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.patient_payment_refunds ppr
    where ppr.clinic_id = old.clinic_id
      and ppr.payment_id = old.id
  ) then
    raise exception 'Cannot delete patient payment % with refund records', old.id
      using errcode = '23514';
  end if;

  return old;
end;
$$;

create trigger prevent_settled_patient_payment_delete
  before delete on public.patient_payments
  for each row execute function public.prevent_settled_patient_payment_delete();

create or replace function public.enforce_patient_refund_limit()
returns trigger
language plpgsql
as $$
declare
  original_amount numeric(10,2);
  original_status public.payment_status;
  original_currency char(3);
  refund_total numeric(10,2);
begin
  if new.status in ('failed', 'cancelled') then
    return new;
  end if;

  select pp.amount, pp.status, pp.currency
    into original_amount, original_status, original_currency
  from public.patient_payments pp
  where pp.clinic_id = new.clinic_id
    and pp.id = new.payment_id
  for update;

  if original_status not in ('paid', 'refunded') then
    raise exception 'Cannot refund unsettled patient payment %', new.payment_id
      using errcode = '23514';
  end if;

  if new.currency <> original_currency then
    raise exception 'Refund currency % does not match payment currency %', new.currency, original_currency
      using errcode = '23514';
  end if;

  select coalesce(sum(ppr.amount), 0)
    into refund_total
  from public.patient_payment_refunds ppr
  where ppr.clinic_id = new.clinic_id
    and ppr.payment_id = new.payment_id
    and ppr.id is distinct from new.id
    and ppr.status not in ('failed', 'cancelled');

  if refund_total + new.amount > original_amount then
    raise exception 'Refund total exceeds original patient payment %', new.payment_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_patient_refund_limit
  before insert or update of amount, status, clinic_id, payment_id on public.patient_payment_refunds
  for each row execute function public.enforce_patient_refund_limit();

create or replace function public.sync_patient_payment_refund_status()
returns trigger
language plpgsql
as $$
declare
  target_clinic_id uuid;
  target_payment_id uuid;
  original_amount numeric(10,2);
  refunded_total numeric(10,2);
begin
  if TG_OP = 'DELETE' then
    target_clinic_id := old.clinic_id;
    target_payment_id := old.payment_id;
  else
    target_clinic_id := new.clinic_id;
    target_payment_id := new.payment_id;
  end if;

  select pp.amount
    into original_amount
  from public.patient_payments pp
  where pp.clinic_id = target_clinic_id
    and pp.id = target_payment_id;

  if original_amount is null then
    return null;
  end if;

  select coalesce(sum(ppr.amount), 0)
    into refunded_total
  from public.patient_payment_refunds ppr
  where ppr.clinic_id = target_clinic_id
    and ppr.payment_id = target_payment_id
    and ppr.status = 'refunded';

  if refunded_total >= original_amount then
    update public.patient_payments
       set status = 'refunded'
     where clinic_id = target_clinic_id
       and id = target_payment_id
       and status = 'paid';
  elsif refunded_total < original_amount then
    update public.patient_payments
       set status = 'paid'
     where clinic_id = target_clinic_id
       and id = target_payment_id
       and status = 'refunded'
       and paid_at is not null;
  end if;

  return null;
end;
$$;

create trigger sync_patient_payment_refund_status
  after insert or update of amount, status, clinic_id, payment_id or delete on public.patient_payment_refunds
  for each row execute function public.sync_patient_payment_refund_status();

create or replace function public.prevent_settled_patient_refund_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'refunded' then
    raise exception 'Cannot delete settled patient refund %', old.id
      using errcode = '23514';
  end if;

  return old;
end;
$$;

create trigger prevent_settled_patient_refund_delete
  before delete on public.patient_payment_refunds
  for each row execute function public.prevent_settled_patient_refund_delete();

create or replace function public.enforce_clinic_subscription_integrity()
returns trigger
language plpgsql
as $$
declare
  target_product_type public.billing_product_type;
  product_currency char(3);
  existing_base_plan uuid;
begin
  perform 1
  from public.clinics c
  where c.id = new.clinic_id
  for update;

  select bp.product_type, bp.currency
    into target_product_type, product_currency
  from public.billing_products bp
  where bp.id = new.product_id;

  if new.currency <> product_currency then
    raise exception 'Subscription currency % does not match product currency %', new.currency, product_currency
      using errcode = '23514';
  end if;

  if target_product_type = 'base_plan' and new.status in ('trialing', 'active', 'past_due') then
    select cs.id
      into existing_base_plan
    from public.clinic_subscriptions cs
    join public.billing_products bp on bp.id = cs.product_id
    where cs.clinic_id = new.clinic_id
      and cs.id is distinct from new.id
      and cs.status in ('trialing', 'active', 'past_due')
      and bp.product_type = 'base_plan'
    limit 1
    for update of cs;

    if existing_base_plan is not null then
      raise exception 'Clinic % already has an active base plan subscription', new.clinic_id
        using errcode = '23505';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_clinic_subscription_integrity
  before insert or update of clinic_id, product_id, status, currency on public.clinic_subscriptions
  for each row execute function public.enforce_clinic_subscription_integrity();

create or replace function public.enforce_subscription_invoice_balance()
returns trigger
language plpgsql
as $$
declare
  paid_total numeric(10,2);
begin
  new.total_amount := new.subtotal_amount + new.tax_amount;

  select coalesce(sum(sp.amount), 0)
    into paid_total
  from public.subscription_payments sp
  where sp.clinic_id = new.clinic_id
    and sp.invoice_id = new.id
    and sp.status = 'paid';

  new.amount_due := greatest(new.total_amount - paid_total, 0);

  if new.status = 'paid' and new.amount_due > 0 then
    raise exception 'Cannot mark invoice % paid while amount_due is %', new.id, new.amount_due
      using errcode = '23514';
  end if;

  if new.status = 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
  end if;

  if new.status = 'void' and paid_total > 0 then
    raise exception 'Cannot void invoice % with settled payments', new.id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_subscription_invoice_balance
  before insert or update of subtotal_amount, tax_amount, total_amount, amount_due, status on public.subscription_invoices
  for each row execute function public.enforce_subscription_invoice_balance();

create or replace function public.enforce_subscription_invoice_item_integrity()
returns trigger
language plpgsql
as $$
declare
  invoice_currency char(3);
  invoice_status_value public.saas_invoice_status;
  product_currency char(3);
  subscription_currency char(3);
begin
  select si.currency, si.status
    into invoice_currency, invoice_status_value
  from public.subscription_invoices si
  where si.clinic_id = new.clinic_id
    and si.id = new.invoice_id
  for update;

  if invoice_status_value <> 'draft' then
    raise exception 'Cannot change line items on % subscription invoice %', invoice_status_value, new.invoice_id
      using errcode = '23514';
  end if;

  if new.product_id is not null then
    select bp.currency
      into product_currency
    from public.billing_products bp
    where bp.id = new.product_id;

    if product_currency <> invoice_currency then
      raise exception 'Invoice item product currency % does not match invoice currency %', product_currency, invoice_currency
        using errcode = '23514';
    end if;
  end if;

  if new.subscription_id is not null then
    select cs.currency
      into subscription_currency
    from public.clinic_subscriptions cs
    where cs.clinic_id = new.clinic_id
      and cs.id = new.subscription_id;

    if subscription_currency <> invoice_currency then
      raise exception 'Invoice item subscription currency % does not match invoice currency %', subscription_currency, invoice_currency
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

create trigger enforce_subscription_invoice_item_integrity
  before insert or update of clinic_id, invoice_id, product_id, subscription_id on public.subscription_invoice_items
  for each row execute function public.enforce_subscription_invoice_item_integrity();

create or replace function public.prevent_settled_subscription_invoice_item_delete()
returns trigger
language plpgsql
as $$
declare
  invoice_status_value public.saas_invoice_status;
begin
  select si.status
    into invoice_status_value
  from public.subscription_invoices si
  where si.clinic_id = old.clinic_id
    and si.id = old.invoice_id;

  if invoice_status_value <> 'draft' then
    raise exception 'Cannot delete line items from % subscription invoice %', invoice_status_value, old.invoice_id
      using errcode = '23514';
  end if;

  return old;
end;
$$;

create trigger prevent_settled_subscription_invoice_item_delete
  before delete on public.subscription_invoice_items
  for each row execute function public.prevent_settled_subscription_invoice_item_delete();

create or replace function public.sync_subscription_invoice_totals()
returns trigger
language plpgsql
as $$
declare
  target_clinic_id uuid;
  target_invoice_id uuid;
  subtotal numeric(10,2);
  tax_total numeric(10,2);
  total numeric(10,2);
  paid_total numeric(10,2);
begin
  if TG_OP = 'DELETE' then
    target_clinic_id := old.clinic_id;
    target_invoice_id := old.invoice_id;
  else
    target_clinic_id := new.clinic_id;
    target_invoice_id := new.invoice_id;
  end if;

  select coalesce(sum(sii.quantity * sii.unit_amount), 0),
         coalesce(sum(sii.tax_amount), 0),
         coalesce(sum(sii.total_amount), 0)
    into subtotal, tax_total, total
  from public.subscription_invoice_items sii
  where sii.clinic_id = target_clinic_id
    and sii.invoice_id = target_invoice_id;

  select coalesce(sum(sp.amount), 0)
    into paid_total
  from public.subscription_payments sp
  where sp.clinic_id = target_clinic_id
    and sp.invoice_id = target_invoice_id
    and sp.status = 'paid';

  update public.subscription_invoices
     set subtotal_amount = subtotal,
         tax_amount = tax_total,
         total_amount = total,
         amount_due = greatest(total - paid_total, 0),
         paid_at = case when total > 0 and paid_total >= total then coalesce(paid_at, now()) else paid_at end,
         status = case
           when status = 'void' then status
           when total > 0 and paid_total >= total then 'paid'::public.saas_invoice_status
           when due_date is not null and due_date < current_date and paid_total < total then 'overdue'::public.saas_invoice_status
           when status = 'paid' and paid_total < total then 'issued'::public.saas_invoice_status
           else status
         end
   where clinic_id = target_clinic_id
     and id = target_invoice_id;

  return null;
end;
$$;

create trigger sync_subscription_invoice_totals_from_items
  after insert or update of quantity, unit_amount, tax_amount, total_amount, clinic_id, invoice_id or delete on public.subscription_invoice_items
  for each row execute function public.sync_subscription_invoice_totals();

create or replace function public.prevent_non_draft_subscription_invoice_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status <> 'draft' then
    raise exception 'Cannot delete non-draft subscription invoice %', old.id
      using errcode = '23514';
  end if;

  return old;
end;
$$;

create trigger prevent_non_draft_subscription_invoice_delete
  before delete on public.subscription_invoices
  for each row execute function public.prevent_non_draft_subscription_invoice_delete();

create or replace function public.enforce_subscription_payment_limit()
returns trigger
language plpgsql
as $$
declare
  invoice_total numeric(10,2);
  invoice_currency char(3);
  invoice_status_value public.saas_invoice_status;
  payment_total numeric(10,2);
begin
  if new.status in ('failed', 'cancelled', 'refunded') then
    return new;
  end if;

  select si.total_amount, si.currency, si.status
    into invoice_total, invoice_currency, invoice_status_value
  from public.subscription_invoices si
  where si.clinic_id = new.clinic_id
    and si.id = new.invoice_id
  for update;

  if invoice_status_value in ('draft', 'void') then
    raise exception 'Cannot pay % subscription invoice %', invoice_status_value, new.invoice_id
      using errcode = '23514';
  end if;

  if new.currency <> invoice_currency then
    raise exception 'Subscription payment currency % does not match invoice currency %', new.currency, invoice_currency
      using errcode = '23514';
  end if;

  select coalesce(sum(sp.amount), 0)
    into payment_total
  from public.subscription_payments sp
  where sp.clinic_id = new.clinic_id
    and sp.invoice_id = new.invoice_id
    and sp.id is distinct from new.id
    and sp.status not in ('failed', 'cancelled', 'refunded');

  if payment_total + new.amount > invoice_total then
    raise exception 'Subscription payment total exceeds invoice %', new.invoice_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger enforce_subscription_payment_limit
  before insert or update of amount, status, clinic_id, invoice_id on public.subscription_payments
  for each row execute function public.enforce_subscription_payment_limit();

create trigger sync_subscription_invoice_totals_from_payments
  after insert or update of amount, status, clinic_id, invoice_id or delete on public.subscription_payments
  for each row execute function public.sync_subscription_invoice_totals();

create or replace function public.prevent_settled_subscription_payment_delete()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('paid', 'refunded') then
    raise exception 'Cannot delete settled subscription payment %', old.id
      using errcode = '23514';
  end if;

  return old;
end;
$$;

create trigger prevent_settled_subscription_payment_delete
  before delete on public.subscription_payments
  for each row execute function public.prevent_settled_subscription_payment_delete();

create index user_profiles_auth_user_id_idx on public.user_profiles(auth_user_id) where auth_user_id is not null;
create index user_profiles_phone_idx on public.user_profiles(phone_e164) where phone_e164 is not null;
create index clinic_memberships_user_idx on public.clinic_memberships(user_id, is_active);
create index clinic_memberships_clinic_role_idx on public.clinic_memberships(clinic_id, role) where is_active;
create index clinics_status_plan_idx on public.clinics(status, plan);
create index clinics_city_idx on public.clinics(city) where city is not null;
create index billing_products_type_active_idx on public.billing_products(product_type, is_active);
create unique index clinic_subscriptions_one_current_product_idx
  on public.clinic_subscriptions(clinic_id, product_id)
  where status in ('trialing', 'active', 'past_due');
create index clinic_subscriptions_status_period_idx on public.clinic_subscriptions(status, current_period_end);
create index clinic_subscriptions_product_status_idx on public.clinic_subscriptions(product_id, status);
create index subscription_invoices_clinic_status_due_idx on public.subscription_invoices(clinic_id, status, due_date);
create index subscription_invoices_status_issued_idx on public.subscription_invoices(status, issued_at desc);
create index subscription_invoice_items_invoice_idx on public.subscription_invoice_items(clinic_id, invoice_id);
create index subscription_payments_invoice_idx on public.subscription_payments(clinic_id, invoice_id);
create index subscription_payments_status_created_idx on public.subscription_payments(status, created_at desc);
create unique index subscription_payments_provider_payment_unique
  on public.subscription_payments(provider_payment_id)
  where provider_payment_id is not null;
create index clinic_doctors_clinic_active_idx on public.clinic_doctors(clinic_id, is_active);
create index patients_clinic_name_trgm_idx on public.patients using gin (full_name gin_trgm_ops);
create index appointments_clinic_date_doctor_queue_idx on public.appointments(clinic_id, appointment_date, doctor_id, queue_status);
create index appointments_clinic_patient_date_idx on public.appointments(clinic_id, patient_id, appointment_date desc);
create index appointments_clinic_source_date_idx on public.appointments(clinic_id, source, appointment_date desc);
create index appointment_vitals_patient_recorded_idx on public.appointment_vitals(clinic_id, patient_id, recorded_at desc);
create index patient_payments_clinic_paid_at_idx on public.patient_payments(clinic_id, paid_at desc) where status = 'paid';
create index patient_payments_clinic_patient_idx on public.patient_payments(clinic_id, patient_id, created_at desc);
create index patient_payments_clinic_appointment_idx on public.patient_payments(clinic_id, appointment_id) where appointment_id is not null;
create index patient_payments_clinic_status_created_idx on public.patient_payments(clinic_id, status, created_at desc);
create unique index patient_payments_provider_transaction_unique
  on public.patient_payments(clinic_id, provider_transaction_id)
  where provider_transaction_id is not null;
create index patient_payment_refunds_clinic_refunded_idx on public.patient_payment_refunds(clinic_id, refunded_at desc) where status = 'refunded';
create unique index patient_payment_refunds_provider_refund_unique
  on public.patient_payment_refunds(clinic_id, provider_refund_id)
  where provider_refund_id is not null;
create index prescriptions_clinic_patient_idx on public.prescriptions(clinic_id, patient_id, created_at desc);
create index prescriptions_clinic_status_idx on public.prescriptions(clinic_id, status, created_at desc);
create index prescriptions_clinic_appointment_idx on public.prescriptions(clinic_id, appointment_id) where appointment_id is not null;
create index medical_records_clinic_patient_idx on public.medical_records(clinic_id, patient_id, recorded_at desc);
create index booking_links_clinic_type_idx on public.booking_links(clinic_id, link_type, is_active);
create index whatsapp_numbers_clinic_idx on public.whatsapp_numbers(clinic_id) where clinic_id is not null;
create index conversation_sessions_clinic_phone_status_idx on public.conversation_sessions(clinic_id, contact_phone_e164, status);
create index conversation_sessions_last_message_idx on public.conversation_sessions(clinic_id, last_message_at desc);
create index conversation_messages_session_created_idx on public.conversation_messages(session_id, created_at);
create index reminder_jobs_due_idx on public.reminder_jobs(status, scheduled_for) where status in ('pending', 'scheduled', 'failed');
create index reminder_jobs_clinic_appointment_idx on public.reminder_jobs(clinic_id, appointment_id) where appointment_id is not null;
create index webhook_events_unprocessed_idx on public.webhook_events(received_at) where processed_at is null and failed_at is null;
create index files_clinic_resource_idx on public.files(clinic_id, resource_type, resource_id);
create index audit_logs_clinic_created_idx on public.audit_logs(clinic_id, created_at desc);
create index medical_representatives_clinic_status_idx on public.medical_representatives(clinic_id, status);
create index mr_visits_clinic_date_idx on public.mr_visits(clinic_id, visit_date desc);
create index medicines_brand_trgm_idx on public.medicines using gin (brand_name gin_trgm_ops);
create index medicines_generic_trgm_idx on public.medicines using gin (generic_name gin_trgm_ops);
create index medicines_search_idx on public.medicines using gin (search_vector);
create index medicine_aliases_alias_trgm_idx on public.medicine_aliases using gin (alias gin_trgm_ops);

create or replace function public.is_platform_user()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.auth_user_id = (select auth.uid())
      and up.platform_role is not null
      and up.is_active
  );
$$;

create or replace function public.has_clinic_membership(target_clinic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.clinic_memberships cm on cm.user_id = up.id
    where up.auth_user_id = (select auth.uid())
      and up.is_active
      and cm.is_active
      and cm.clinic_id = target_clinic_id
  );
$$;

create or replace function public.has_clinic_access(target_clinic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.clinic_memberships cm on cm.user_id = up.id
    where up.auth_user_id = (select auth.uid())
      and up.is_active
      and cm.is_active
      and cm.clinic_id = target_clinic_id
  ) or public.is_platform_user();
$$;

create or replace function public.is_clinic_owner(target_clinic_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles up
    join public.clinic_memberships cm on cm.user_id = up.id
    where up.auth_user_id = (select auth.uid())
      and up.is_active
      and cm.is_active
      and cm.clinic_id = target_clinic_id
      and cm.role in ('doctor_owner', 'owner')
  ) or public.is_platform_user();
$$;

create or replace function public.shares_clinic_with_user(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_profiles requester
    join public.clinic_memberships requester_cm on requester_cm.user_id = requester.id
    join public.clinic_memberships target_cm on target_cm.clinic_id = requester_cm.clinic_id
    where requester.auth_user_id = (select auth.uid())
      and requester.is_active
      and requester_cm.is_active
      and target_cm.is_active
      and target_cm.user_id = target_user_id
  ) or public.is_platform_user();
$$;

alter table public.user_profiles enable row level security;
alter table public.clinics enable row level security;
alter table public.clinic_memberships enable row level security;
alter table public.clinic_settings enable row level security;
alter table public.billing_products enable row level security;
alter table public.clinic_subscriptions enable row level security;
alter table public.subscription_invoices enable row level security;
alter table public.subscription_invoice_items enable row level security;
alter table public.subscription_payments enable row level security;
alter table public.clinic_doctors enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_vitals enable row level security;
alter table public.patient_payments enable row level security;
alter table public.patient_payment_refunds enable row level security;
alter table public.medical_records enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_medicines enable row level security;
alter table public.booking_links enable row level security;
alter table public.whatsapp_numbers enable row level security;
alter table public.conversation_sessions enable row level security;
alter table public.conversation_messages enable row level security;
alter table public.reminder_jobs enable row level security;
alter table public.files enable row level security;
alter table public.audit_logs enable row level security;
alter table public.demo_requests enable row level security;
alter table public.medical_representatives enable row level security;
alter table public.mr_visits enable row level security;
alter table public.mr_samples enable row level security;
alter table public.medicines enable row level security;
alter table public.medicine_aliases enable row level security;
alter table public.doctor_medicine_prefs enable row level security;
alter table public.webhook_events enable row level security;

create policy "Users can read their profile or platform can read profiles"
  on public.user_profiles for select to authenticated
  using (auth_user_id = (select auth.uid()) or public.shares_clinic_with_user(id));

create policy "Platform users manage profiles"
  on public.user_profiles for all to authenticated
  using (public.is_platform_user())
  with check (public.is_platform_user());

create policy "Clinic members can read their clinics"
  on public.clinics for select to authenticated
  using (public.has_clinic_access(id));

create policy "Platform users manage clinics"
  on public.clinics for all to authenticated
  using (public.is_platform_user())
  with check (public.is_platform_user());

create policy "Clinic members can read memberships"
  on public.clinic_memberships for select to authenticated
  using (public.has_clinic_access(clinic_id));

create policy "Clinic owners and platform manage memberships"
  on public.clinic_memberships for all to authenticated
  using (public.is_clinic_owner(clinic_id))
  with check (public.is_clinic_owner(clinic_id));

create policy "Clinic access to settings" on public.clinic_settings
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to doctors" on public.clinic_doctors
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to patients" on public.patients
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to appointments" on public.appointments
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to vitals" on public.appointment_vitals
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic members access patient payments" on public.patient_payments
  for all to authenticated using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy "Clinic members access patient payment refunds" on public.patient_payment_refunds
  for all to authenticated using (public.has_clinic_membership(clinic_id)) with check (public.has_clinic_membership(clinic_id));
create policy "Platform users manage billing products" on public.billing_products
  for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());
create policy "Platform users manage clinic subscriptions" on public.clinic_subscriptions
  for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());
create policy "Platform users manage subscription invoices" on public.subscription_invoices
  for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());
create policy "Platform users manage subscription invoice items" on public.subscription_invoice_items
  for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());
create policy "Platform users manage subscription payments" on public.subscription_payments
  for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());
create policy "Clinic access to medical records" on public.medical_records
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to prescriptions" on public.prescriptions
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to prescription medicines" on public.prescription_medicines
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to booking links" on public.booking_links
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to conversation sessions" on public.conversation_sessions
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to conversation messages" on public.conversation_messages
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to reminder jobs" on public.reminder_jobs
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to files" on public.files
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to audit logs" on public.audit_logs
  for select to authenticated using (clinic_id is null and public.is_platform_user() or public.has_clinic_access(clinic_id));
create policy "Clinic access to MRs" on public.medical_representatives
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to MR visits" on public.mr_visits
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to MR samples" on public.mr_samples
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));
create policy "Clinic access to doctor medicine prefs" on public.doctor_medicine_prefs
  for all to authenticated using (public.has_clinic_access(clinic_id)) with check (public.has_clinic_access(clinic_id));

create policy "Authenticated users can read medicines"
  on public.medicines for select to authenticated using (true);
create policy "Authenticated users can read medicine aliases"
  on public.medicine_aliases for select to authenticated using (true);
create policy "Platform users manage medicine catalog"
  on public.medicines for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());
create policy "Platform users manage medicine aliases"
  on public.medicine_aliases for all to authenticated using (public.is_platform_user()) with check (public.is_platform_user());

create policy "Platform users access shared whatsapp numbers"
  on public.whatsapp_numbers for all to authenticated
  using (clinic_id is null and public.is_platform_user() or clinic_id is not null and public.has_clinic_access(clinic_id))
  with check (clinic_id is null and public.is_platform_user() or clinic_id is not null and public.has_clinic_access(clinic_id));

create policy "Anyone can create demo requests"
  on public.demo_requests for insert to anon, authenticated
  with check (true);
create policy "Platform users read demo requests"
  on public.demo_requests for select to authenticated
  using (public.is_platform_user());

create policy "Platform users manage webhook events"
  on public.webhook_events for all to authenticated
  using (public.is_platform_user())
  with check (public.is_platform_user());

commit;
