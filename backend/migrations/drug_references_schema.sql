-- =============================================================================
-- TRIKMED AI Engine: Drug References & Lab Test References Schema
-- Adheres to Technical Specification Section 3.4, Section 5.3 & Appendix A.1
-- =============================================================================

-- 1. Enable pg_trgm for sub-millisecond fuzzy matching inside PostgreSQL
create extension if not exists pg_trgm;
create extension if not exists fuzzystrmatch;

-- 2. Drug References Table (Section 3.4)
create table if not exists public.drug_references (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  generic text,
  strength text,
  category text,
  form text,
  manufacturer text,
  atc_code text,
  atc_category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigram GIN indexes for fast text similarity
create index if not exists idx_drug_brand_trgm on public.drug_references using gin (brand gin_trgm_ops);
create index if not exists idx_drug_generic_trgm on public.drug_references using gin (generic gin_trgm_ops);
create index if not exists idx_drug_atc on public.drug_references (atc_code);

-- 3. Doctor Corrections Table (Section 3.4)
-- Records automatic corrections and doctor overrides for auditability & AI self-learning
create table if not exists public.doctor_corrections (
  id uuid primary key default gen_random_uuid(),
  prescription_id uuid,
  doctor_id uuid,
  item_type text not null default 'drug' check (item_type in ('drug', 'lab_test', 'instruction')),
  original_text text not null,
  corrected_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_doctor_corrections_item on public.doctor_corrections (item_type, original_text);

-- 4. Lab Test References Table (Comprehensive Pathology & Radiology Catalog)
create table if not exists public.lab_test_references (
  id uuid primary key default gen_random_uuid(),
  test_name text not null,
  category text not null default 'Pathology',
  specimen text,                     -- e.g. Blood, Urine, Stool, Swab, Imaging
  turnaround_time text,              -- e.g. Same Day, 24 Hours
  common_aliases text[] not null default '{}',
  is_fasting_required boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_lab_test_name_trgm on public.lab_test_references using gin (test_name gin_trgm_ops);

-- 5. RPC Function: match_drug_name (Appendix A.1)
-- Runs similarity search inside PostgreSQL and returns top 5 matching candidates
create or replace function public.match_drug_name(query text)
returns table (
  id uuid,
  brand text,
  generic text,
  strength text,
  form text,
  category text,
  atc_code text,
  score real
) language sql stable as $$
  select
    id, brand, generic, strength, form, category, atc_code,
    greatest(similarity(brand, query), similarity(coalesce(generic, ''), query)) as score
  from public.drug_references
  where is_active = true
  order by score desc
  limit 5;
$$;

-- 6. RPC Function: match_lab_test
-- Runs similarity search for spoken diagnostic investigations
create or replace function public.match_lab_test(query text)
returns table (
  id uuid,
  test_name text,
  category text,
  specimen text,
  is_fasting_required boolean,
  score real
) language sql stable as $$
  select
    id, test_name, category, specimen, is_fasting_required,
    similarity(test_name, query) as score
  from public.lab_test_references
  where is_active = true
  order by score desc
  limit 5;
$$;
