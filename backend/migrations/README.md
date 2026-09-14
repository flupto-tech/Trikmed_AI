# TrikMed Migration Files

## Canonical Migrations (Apply in Order)

| File | Purpose | Status |
|------|---------|--------|
| `drug_references_schema.sql` | Creates `drug_references`, `doctor_corrections`, `lab_test_references` tables and the `match_drug_name` / `match_lab_test` RPC functions using `pg_trgm`. **Apply this first.** | Canonical |
| `02_add_pgvector.sql` | Adds `vector(384)` embedding column to `drug_references` and creates the `match_drug_semantic` RPC function using `pgvector`. **Apply after schema.** | Canonical |

## RPC Name Clarification

There are **two** RPC functions for drug search — they are NOT duplicates:

| Function | Extension | Layer | Usage |
|----------|-----------|-------|-------|
| `match_drug_name(query text)` | `pg_trgm` | Fuzzy / trigram similarity | Called by `supabase_drug_client.rpc_match_drug()` when the in-memory RapidFuzz score falls below threshold. Used for exact/near-exact text search. |
| `match_drug_semantic(query_embedding vector(384))` | `pgvector` | Semantic / embedding similarity | Called by `supabase_drug_client.rpc_match_drug_semantic()` for Layer 2 fallback. Result is capped at YELLOW band (never GREEN). |

## Alembic Versions (Application schema — separate concern)

The files under `versions/` (`0001_mr_manager_module.py`, `0002_mr_info_columns.py`, `0003_production_schema_v2.py`) are Alembic migrations for the application schema (appointments, patients, staff, etc.). They are not related to the drug validation tables above.

## Applying the Drug Migrations

Run against your Supabase project via the SQL editor or Supabase CLI:

```bash
# 1. Schema + pg_trgm RPCs
supabase db push --file migrations/drug_references_schema.sql

# 2. pgvector column + semantic RPC
supabase db push --file migrations/02_add_pgvector.sql
```

Or manually paste into the Supabase SQL Editor.
