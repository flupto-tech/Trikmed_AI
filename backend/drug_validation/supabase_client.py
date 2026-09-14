"""Supabase PostgREST client for drug and lab test validation.
Section 5.3: Thin wrapper around existing httpx/Supabase pattern without ORM or Celery.
"""

from __future__ import annotations
import os
from typing import Any
import httpx

from app.storage.supabase_rest import get_supabase_admin_key, supabase_rest_headers


def _get_base_url() -> str:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not url:
        # Fallback to local or default
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    return url


class SupabaseDrugClient:
    """Synchronous & async PostgREST interface to drug_references & doctor_corrections."""

    def __init__(self, timeout: float = 5.0):
        self.base_url = _get_base_url()
        self.key, _ = get_supabase_admin_key()
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.key)

    def _headers(self) -> dict[str, str]:
        return supabase_rest_headers(self.key)

    def rpc_match_drug(self, query: str) -> list[dict[str, Any]]:
        """Call PostgreSQL RPC function match_drug_name using pg_trgm (Appendix A.1)."""
        if not self.is_configured:
            return []
        try:
            url = f"{self.base_url}/rest/v1/rpc/match_drug_name"
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json={"query": query})
                if res.is_success:
                    return res.json()
        except Exception as e:
            # Fallback to in-memory RapidFuzz if DB connection fails
            pass
        return []

    def rpc_match_lab_test(self, query: str) -> list[dict[str, Any]]:
        """Call PostgreSQL RPC function match_lab_test using pg_trgm."""
        if not self.is_configured:
            return []
        try:
            url = f"{self.base_url}/rest/v1/rpc/match_lab_test"
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json={"query": query})
                if res.is_success:
                    return res.json()
        except Exception as e:
            pass
        return []

    def rpc_match_drug_semantic(self, query_embedding: list[float]) -> list[dict[str, Any]]:
        """Call PostgreSQL RPC function match_drug_semantic using pgvector."""
        if not self.is_configured:
            return []
        try:
            url = f"{self.base_url}/rest/v1/rpc/match_drug_semantic"
            # PostgREST expects the array format for vector
            payload = {"query_embedding": f"[{','.join(map(str, query_embedding))}]"}
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json=payload)
                if res.is_success:
                    return res.json()
        except Exception as e:
            pass
        return []

    def bulk_insert_drugs(self, drugs: list[dict[str, Any]], batch_size: int = 500) -> int:
        """Bulk-load cleaned formulations into drug_references table (Section 4.7)."""
        if not self.is_configured or not drugs:
            return 0
        total_inserted = 0
        url = f"{self.base_url}/rest/v1/drug_references"
        headers = self._headers()
        headers["Prefer"] = "resolution=merge-duplicates"

        with httpx.Client(timeout=30.0) as client:
            for i in range(0, len(drugs), batch_size):
                batch = drugs[i : i + batch_size]
                try:
                    res = client.post(url, headers=headers, json=batch)
                    if res.is_success:
                        total_inserted += len(batch)
                except Exception as e:
                    print(f"[SupabaseDrugClient] Bulk insert batch error: {e}")
        return total_inserted

    def bulk_insert_lab_tests(self, tests: list[dict[str, Any]], batch_size: int = 500) -> int:
        """Bulk-load diagnostic tests into lab_test_references table."""
        if not self.is_configured or not tests:
            return 0
        total_inserted = 0
        url = f"{self.base_url}/rest/v1/lab_test_references"
        headers = self._headers()
        headers["Prefer"] = "resolution=merge-duplicates"

        with httpx.Client(timeout=30.0) as client:
            for i in range(0, len(tests), batch_size):
                batch = tests[i : i + batch_size]
                try:
                    res = client.post(url, headers=headers, json=batch)
                    if res.is_success:
                        total_inserted += len(batch)
                except Exception as e:
                    print(f"[SupabaseDrugClient] Bulk lab tests insert error: {e}")
        return total_inserted

    def log_doctor_correction(
        self,
        original_text: str,
        corrected_text: str,
        prescription_id: str | None = None,
        doctor_id: str | None = None,
        item_type: str = "drug",
    ) -> bool:
        """Section 5.3: Direct synchronous insert at approval time."""
        if not self.is_configured:
            return False
        try:
            url = f"{self.base_url}/rest/v1/doctor_corrections"
            payload = {
                "original_text": original_text,
                "corrected_text": corrected_text,
                "item_type": item_type,
            }
            if prescription_id:
                payload["prescription_id"] = prescription_id
            if doctor_id:
                payload["doctor_id"] = doctor_id

            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json=payload)
                return res.is_success
        except Exception:
            return False


# Singleton client
supabase_drug_client = SupabaseDrugClient()
