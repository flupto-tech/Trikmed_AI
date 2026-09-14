-- =============================================================================
-- TRIKMED AI Engine: Add pgvector and semantic search to drug_references
-- Adheres to Technical Specification Phase 3 & Appendix A.2
-- =============================================================================

-- 1. Enable pgvector extension
create extension if not exists vector;

-- 2. Add embedding column to drug_references
alter table public.drug_references add column if not exists embedding vector(384);

-- 3. Create index for faster vector search (optional but recommended)
-- hnsw or ivfflat. HNSW is better for high recall.
-- create index if not exists idx_drug_references_embedding on public.drug_references using hnsw (embedding vector_cosine_ops);

-- 4. RPC Function: match_drug_semantic (Phase 7)
-- Runs semantic similarity search inside PostgreSQL and returns top 5 matching candidates
create or replace function public.match_drug_semantic(query_embedding vector(384))
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
    1 - (embedding <=> query_embedding) as score
  from public.drug_references
  where is_active = true and embedding is not null
  order by embedding <=> query_embedding
  limit 5;
$$;
