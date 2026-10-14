"""Supabase PostgREST client for drug and lab test validation.
Section 5.3: Thin wrapper around existing httpx/Supabase pattern without ORM or Celery.

Demo-mode contract
------------------
When ``TRIKMED_DEMO_MODE=true`` **or** the ``SUPABASE_URL`` contains the word
"placeholder" (the same condition used by :class:`~app.storage.supabase_store.SupabaseStore`),
the client is in *demo mode*:

* All RPC read methods return an explicit ``_DEMO_UNAVAILABLE`` sentinel so the
  caller can tell the difference between "no match found" and "not attempted".
* ``bulk_insert_drugs``, ``bulk_insert_lab_tests``, and ``log_doctor_correction``
  raise ``RuntimeError`` rather than silently skipping or writing data.
* Zero HTTP connections are made to any Supabase host.

Error transparency
------------------
RPC network/HTTP errors are **not** swallowed.  They are logged at WARNING level
(safe details only — no secrets, no patient data) and re-raised so callers can
distinguish a genuine *no-match* (empty list) from a network failure.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx

from app.core.config import load_environment
from app.storage.supabase_rest import get_supabase_admin_key, supabase_rest_headers

logger = logging.getLogger(__name__)

# Sentinel returned (inside a list) by RPC methods when demo mode is active.
# Callers check:  results and results[0].get("_demo_unavailable")
_DEMO_UNAVAILABLE: dict[str, Any] = {"_demo_unavailable": True}


def _is_demo_mode() -> bool:
    """Mirror the exact same logic used by SupabaseStore.__init__."""
    load_environment()
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not url:
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    return "placeholder" in url or os.getenv("TRIKMED_DEMO_MODE", "").lower() == "true"


def _get_base_url() -> str:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    if not url:
        url = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip().rstrip("/")
    return url


class SupabaseDrugClient:
    """Synchronous PostgREST interface to drug_references & doctor_corrections.

    Instantiated lazily so that environment variables are fully resolved before
    the URL and key are read.
    """

    def __init__(self, timeout: float = 5.0):
        load_environment()
        self.timeout = timeout
        self._demo = _is_demo_mode()
        if self._demo:
            self.base_url = ""
            self.key = ""
            logger.info(
                "SupabaseDrugClient: demo mode active — "
                "no Supabase HTTP requests will be made"
            )
        else:
            self.base_url = _get_base_url()
            self.key, _ = get_supabase_admin_key()

    @property
    def is_configured(self) -> bool:
        return not self._demo and bool(self.base_url and self.key)

    def _headers(self) -> dict[str, str]:
        return supabase_rest_headers(self.key)

    # ------------------------------------------------------------------
    # Read / RPC methods
    # ------------------------------------------------------------------

    def rpc_match_drug(self, query: str) -> list[dict[str, Any]]:
        """Call PostgreSQL RPC function match_drug_name using pg_trgm (Appendix A.1).

        Returns:
            Non-empty list of match dicts on success, or empty list on genuine no-match.
            In demo mode, returns ``[{"_demo_unavailable": True}]``.

        Raises:
            RuntimeError: on HTTP error or network failure (not silently swallowed).
        """
        if self._demo:
            logger.debug("rpc_match_drug(%r): demo mode — returning unavailable sentinel", query)
            return [_DEMO_UNAVAILABLE]
        if not self.is_configured:
            return []
        url = f"{self.base_url}/rest/v1/rpc/match_drug_name"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json={"query": query})
                if res.is_success:
                    return res.json()
                raise RuntimeError(
                    f"rpc_match_drug: Supabase returned HTTP {res.status_code}"
                )
        except httpx.TransportError as exc:
            logger.warning("rpc_match_drug(%r): network error — %s", query, type(exc).__name__)
            raise RuntimeError(f"rpc_match_drug: network error ({type(exc).__name__})") from exc

    def rpc_match_lab_test(self, query: str) -> list[dict[str, Any]]:
        """Call PostgreSQL RPC function match_lab_test using pg_trgm.

        Returns ``[{"_demo_unavailable": True}]`` in demo mode.

        Raises:
            RuntimeError: on HTTP error or network failure.
        """
        if self._demo:
            logger.debug("rpc_match_lab_test(%r): demo mode — returning unavailable sentinel", query)
            return [_DEMO_UNAVAILABLE]
        if not self.is_configured:
            return []
        url = f"{self.base_url}/rest/v1/rpc/match_lab_test"
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json={"query": query})
                if res.is_success:
                    return res.json()
                raise RuntimeError(
                    f"rpc_match_lab_test: Supabase returned HTTP {res.status_code}"
                )
        except httpx.TransportError as exc:
            logger.warning("rpc_match_lab_test(%r): network error — %s", query, type(exc).__name__)
            raise RuntimeError(f"rpc_match_lab_test: network error ({type(exc).__name__})") from exc

    def rpc_match_drug_semantic(self, query_embedding: list[float]) -> list[dict[str, Any]]:
        """Call PostgreSQL RPC function match_drug_semantic using pgvector.

        Returns ``[{"_demo_unavailable": True}]`` in demo mode.

        Raises:
            RuntimeError: on HTTP error or network failure.
        """
        if self._demo:
            logger.debug("rpc_match_drug_semantic: demo mode — returning unavailable sentinel")
            return [_DEMO_UNAVAILABLE]
        if not self.is_configured:
            return []
        url = f"{self.base_url}/rest/v1/rpc/match_drug_semantic"
        payload = {"query_embedding": f"[{','.join(map(str, query_embedding))}]"}
        try:
            with httpx.Client(timeout=self.timeout) as client:
                res = client.post(url, headers=self._headers(), json=payload)
                if res.is_success:
                    return res.json()
                raise RuntimeError(
                    f"rpc_match_drug_semantic: Supabase returned HTTP {res.status_code}"
                )
        except httpx.TransportError as exc:
            logger.warning("rpc_match_drug_semantic: network error — %s", type(exc).__name__)
            raise RuntimeError(
                f"rpc_match_drug_semantic: network error ({type(exc).__name__})"
            ) from exc

    # ------------------------------------------------------------------
    # Write methods — blocked in demo mode
    # ------------------------------------------------------------------

    def bulk_insert_drugs(self, drugs: list[dict[str, Any]], batch_size: int = 500) -> int:
        """Bulk-load cleaned formulations into drug_references table (Section 4.7).

        Raises:
            RuntimeError: if called in demo mode.
        """
        if self._demo:
            raise RuntimeError(
                "bulk_insert_drugs: blocked in demo mode — "
                "set TRIKMED_DEMO_MODE=false and configure a real Supabase project to import data"
            )
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
                    else:
                        logger.warning(
                            "bulk_insert_drugs: batch %d failed with HTTP %d",
                            i // batch_size,
                            res.status_code,
                        )
                except httpx.TransportError as exc:
                    logger.warning(
                        "bulk_insert_drugs: batch %d network error — %s",
                        i // batch_size,
                        type(exc).__name__,
                    )
        return total_inserted

    def bulk_insert_lab_tests(self, tests: list[dict[str, Any]], batch_size: int = 500) -> int:
        """Bulk-load diagnostic tests into lab_test_references table.

        Raises:
            RuntimeError: if called in demo mode.
        """
        if self._demo:
            raise RuntimeError(
                "bulk_insert_lab_tests: blocked in demo mode — "
                "set TRIKMED_DEMO_MODE=false and configure a real Supabase project to import data"
            )
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
                    else:
                        logger.warning(
                            "bulk_insert_lab_tests: batch %d failed with HTTP %d",
                            i // batch_size,
                            res.status_code,
                        )
                except httpx.TransportError as exc:
                    logger.warning(
                        "bulk_insert_lab_tests: batch %d network error — %s",
                        i // batch_size,
                        type(exc).__name__,
                    )
        return total_inserted

    def log_doctor_correction(
        self,
        original_text: str,
        corrected_text: str,
        prescription_id: str | None = None,
        doctor_id: str | None = None,
        item_type: str = "drug",
    ) -> bool:
        """Section 5.3: Direct synchronous insert at approval time.

        Raises:
            RuntimeError: if called in demo mode.
        """
        if self._demo:
            raise RuntimeError(
                "log_doctor_correction: blocked in demo mode — "
                "corrections cannot be persisted without a real Supabase project"
            )
        if not self.is_configured:
            return False
        try:
            url = f"{self.base_url}/rest/v1/doctor_corrections"
            payload: dict[str, Any] = {
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
                if not res.is_success:
                    logger.warning(
                        "log_doctor_correction: Supabase returned HTTP %d", res.status_code
                    )
                    return False
                return True
        except httpx.TransportError as exc:
            logger.warning("log_doctor_correction: network error — %s", type(exc).__name__)
            return False


# ---------------------------------------------------------------------------
# Module-level singleton — lazy construction ensures env vars are loaded first.
# ---------------------------------------------------------------------------
_client: SupabaseDrugClient | None = None


def get_supabase_drug_client() -> SupabaseDrugClient:
    """Return the shared singleton, constructing it on first call."""
    global _client
    if _client is None:
        _client = SupabaseDrugClient()
    return _client


# Backward-compatible alias used by drug_validator.py and tests that import
# the module-level name directly.  The object is built lazily on first attribute
# access via the proxy below so that env vars are set before URL/key are read.
class _LazyProxy:
    """Proxy so ``supabase_drug_client.rpc_match_drug(...)`` still works without
    requiring callers to call ``get_supabase_drug_client()`` explicitly."""

    def __getattr__(self, name: str) -> Any:  # type: ignore[override]
        return getattr(get_supabase_drug_client(), name)

    def __repr__(self) -> str:
        return repr(get_supabase_drug_client())


supabase_drug_client = _LazyProxy()
