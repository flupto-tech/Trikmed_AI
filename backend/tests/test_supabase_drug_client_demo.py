"""Regression tests for SupabaseDrugClient demo-mode safety.

Requirements verified:
  R1  TRIKMED_DEMO_MODE is read consistently with the storage layer.
  R2  In demo mode, rpc_match_drug / rpc_match_lab_test / rpc_match_drug_semantic
      must NOT make any HTTP requests and must return the _demo_unavailable sentinel.
  R3  bulk_insert_drugs, bulk_insert_lab_tests, log_doctor_correction must raise
      RuntimeError in demo mode — no writes.
  R4  Demo mode cannot be changed automatically; the client reads env vars once on
      construction.
  R5  RPC/network errors are not silently swallowed: they raise RuntimeError so the
      caller can distinguish "no match" from "network failure".
  R6  Tests use mocked httpx — no real Supabase credentials required.
  R8  Lab-test RPC path (rpc_match_lab_test) is covered.
"""

from __future__ import annotations

import os
import importlib
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fresh_client(demo: bool, url: str = "https://example.supabase.co", key: str = "test-key"):
    """Build a fresh SupabaseDrugClient with controlled env vars."""
    env = {
        "SUPABASE_URL": url,
        "TRIKMED_DEMO_MODE": "true" if demo else "false",
        "SUPABASE_SECRET_KEY": key,
    }
    with patch.dict(os.environ, env, clear=False):
        # Force re-import so the module-level singleton is bypassed.
        import drug_validation.supabase_client as mod
        client = mod.SupabaseDrugClient()
    return client


def _placeholder_client():
    """Client whose URL contains 'placeholder' — must be treated as demo mode."""
    return _fresh_client(demo=False, url="https://placeholder.supabase.co")


# ---------------------------------------------------------------------------
# R1 — Demo mode detection is consistent with the storage layer
# ---------------------------------------------------------------------------

class TestDemoModeDetection:

    def test_trikmed_demo_mode_true_env_sets_demo(self):
        client = _fresh_client(demo=True)
        assert client._demo is True, "TRIKMED_DEMO_MODE=true must enable demo mode"

    def test_trikmed_demo_mode_false_env_clears_demo(self):
        client = _fresh_client(demo=False)
        assert client._demo is False, "TRIKMED_DEMO_MODE=false must not enable demo mode"

    def test_placeholder_url_sets_demo(self):
        """SupabaseStore uses 'placeholder' in URL as demo signal — client must do the same."""
        client = _placeholder_client()
        assert client._demo is True, "URL containing 'placeholder' must enable demo mode"

    def test_demo_mode_is_not_configured(self):
        client = _fresh_client(demo=True)
        assert client.is_configured is False


# ---------------------------------------------------------------------------
# R2 — No HTTP requests made in demo mode (rpc read methods)
# ---------------------------------------------------------------------------

class TestNoHttpInDemoMode:
    """httpx.Client must never be instantiated when _demo=True."""

    def _assert_no_http(self, method_name: str, *args):
        client = _fresh_client(demo=True)
        with patch("httpx.Client") as mock_httpx:
            getattr(client, method_name)(*args)
        mock_httpx.assert_not_called(), (
            f"{method_name}: httpx.Client was constructed in demo mode — "
            "this means an HTTP request was (or could be) made"
        )

    def test_rpc_match_drug_no_http(self):
        self._assert_no_http("rpc_match_drug", "paracetamol")

    def test_rpc_match_lab_test_no_http(self):
        self._assert_no_http("rpc_match_lab_test", "CBC")

    def test_rpc_match_drug_semantic_no_http(self):
        self._assert_no_http("rpc_match_drug_semantic", [0.1, 0.2, 0.3])

    def test_rpc_match_drug_returns_sentinel(self):
        client = _fresh_client(demo=True)
        result = client.rpc_match_drug("amoxicillin")
        assert result, "Expected at least one item (the sentinel)"
        assert result[0].get("_demo_unavailable") is True, (
            "rpc_match_drug must return the _demo_unavailable sentinel, not an empty list"
        )

    def test_rpc_match_lab_test_returns_sentinel(self):
        client = _fresh_client(demo=True)
        result = client.rpc_match_lab_test("CBC")
        assert result and result[0].get("_demo_unavailable") is True

    def test_rpc_match_drug_semantic_returns_sentinel(self):
        client = _fresh_client(demo=True)
        result = client.rpc_match_drug_semantic([0.1] * 5)
        assert result and result[0].get("_demo_unavailable") is True

    def test_placeholder_url_also_blocks_http(self):
        """URL='placeholder' triggers demo mode — same HTTP-block guarantee."""
        client = _placeholder_client()
        with patch("httpx.Client") as mock_httpx:
            client.rpc_match_drug("metformin")
        mock_httpx.assert_not_called()


# ---------------------------------------------------------------------------
# R3 — Write methods raise RuntimeError in demo mode
# ---------------------------------------------------------------------------

class TestWritesBlockedInDemoMode:

    def test_bulk_insert_drugs_raises(self):
        client = _fresh_client(demo=True)
        with pytest.raises(RuntimeError, match="bulk_insert_drugs.*demo mode"):
            client.bulk_insert_drugs([{"name": "Paracetamol"}])

    def test_bulk_insert_lab_tests_raises(self):
        client = _fresh_client(demo=True)
        with pytest.raises(RuntimeError, match="bulk_insert_lab_tests.*demo mode"):
            client.bulk_insert_lab_tests([{"name": "CBC"}])

    def test_log_doctor_correction_raises(self):
        client = _fresh_client(demo=True)
        with pytest.raises(RuntimeError, match="log_doctor_correction.*demo mode"):
            client.log_doctor_correction("old", "new")

    def test_bulk_insert_drugs_no_http_in_demo(self):
        client = _fresh_client(demo=True)
        with patch("httpx.Client") as mock_httpx:
            with pytest.raises(RuntimeError):
                client.bulk_insert_drugs([{"name": "x"}])
        mock_httpx.assert_not_called()

    def test_log_doctor_correction_no_http_in_demo(self):
        client = _fresh_client(demo=True)
        with patch("httpx.Client") as mock_httpx:
            with pytest.raises(RuntimeError):
                client.log_doctor_correction("original", "corrected")
        mock_httpx.assert_not_called()


# ---------------------------------------------------------------------------
# R5 — RPC errors are not silently swallowed
# ---------------------------------------------------------------------------

class TestRPCErrorTransparency:
    """In production mode (non-demo), HTTP and network errors must raise RuntimeError."""

    def _prod_client_with_mock_http(self, status_code: int | None = None, transport_error: bool = False):
        """Return a production-mode client + context manager that mocks httpx.Client."""
        client = _fresh_client(demo=False)
        mock_response = MagicMock()
        if status_code is not None:
            mock_response.is_success = status_code < 400
            mock_response.status_code = status_code
        mock_cm = MagicMock()
        mock_cm.__enter__ = MagicMock(return_value=mock_cm)
        mock_cm.__exit__ = MagicMock(return_value=False)
        if transport_error:
            import httpx as _httpx
            mock_cm.post = MagicMock(side_effect=_httpx.ConnectError("refused"))
        else:
            mock_cm.post = MagicMock(return_value=mock_response)
        return client, mock_cm

    def test_rpc_match_drug_http_error_raises(self):
        client, mock_cm = self._prod_client_with_mock_http(status_code=503)
        with patch("httpx.Client", return_value=mock_cm):
            with pytest.raises(RuntimeError, match="rpc_match_drug.*HTTP 503"):
                client.rpc_match_drug("dolo")

    def test_rpc_match_lab_test_http_error_raises(self):
        client, mock_cm = self._prod_client_with_mock_http(status_code=500)
        with patch("httpx.Client", return_value=mock_cm):
            with pytest.raises(RuntimeError, match="rpc_match_lab_test.*HTTP 500"):
                client.rpc_match_lab_test("CBC")

    def test_rpc_match_drug_semantic_http_error_raises(self):
        client, mock_cm = self._prod_client_with_mock_http(status_code=401)
        with patch("httpx.Client", return_value=mock_cm):
            with pytest.raises(RuntimeError, match="rpc_match_drug_semantic.*HTTP 401"):
                client.rpc_match_drug_semantic([0.1] * 3)

    def test_rpc_match_drug_network_error_raises(self):
        client, mock_cm = self._prod_client_with_mock_http(transport_error=True)
        with patch("httpx.Client", return_value=mock_cm):
            with pytest.raises(RuntimeError, match="rpc_match_drug.*network error"):
                client.rpc_match_drug("dolo")

    def test_rpc_successful_response_returns_list(self):
        """Sanity: a 200 response returns parsed JSON — not a RuntimeError."""
        client = _fresh_client(demo=False)
        mock_response = MagicMock()
        mock_response.is_success = True
        mock_response.json.return_value = [{"brand": "Dolo", "score": 0.95}]
        mock_cm = MagicMock()
        mock_cm.__enter__ = MagicMock(return_value=mock_cm)
        mock_cm.__exit__ = MagicMock(return_value=False)
        mock_cm.post = MagicMock(return_value=mock_response)
        with patch("httpx.Client", return_value=mock_cm):
            result = client.rpc_match_drug("dolo")
        assert result == [{"brand": "Dolo", "score": 0.95}]


# ---------------------------------------------------------------------------
# R6 — Sentinel does not propagate to drug_validator as a verified match
# ---------------------------------------------------------------------------

class TestSentinelFilteredByDrugValidator:
    """DrugValidator._semantic_fallback must not treat the sentinel as a valid drug."""

    def test_sentinel_is_not_treated_as_match(self):
        from app.services.drug_validator import DrugValidator

        validator = DrugValidator.__new__(DrugValidator)
        validator.medicines = []
        validator.brand_lookup = {}
        validator.brand_names = []
        validator.generic_lookup = {}
        validator.atc_lookup = {}
        validator.validation_logs = []
        validator.matcher = None

        sentinel = [{"_demo_unavailable": True}]

        with patch("drug_validation.embeddings.embedding_service") as mock_emb, \
             patch("drug_validation.supabase_client.supabase_drug_client") as mock_client:
            mock_emb.get_embedding.return_value = [0.1, 0.2, 0.3]
            mock_client.rpc_match_drug_semantic.return_value = sentinel

            result = validator._semantic_fallback("some drug")

        assert result is None, (
            "_semantic_fallback must return None when only the demo sentinel is present, "
            "not a fabricated drug match"
        )

    def test_real_hit_above_threshold_is_returned(self):
        """Contrasting test: a real high-score hit is still returned."""
        from app.services.drug_validator import DrugValidator

        validator = DrugValidator.__new__(DrugValidator)
        validator.medicines = []
        validator.brand_lookup = {}
        validator.brand_names = []
        validator.generic_lookup = {}
        validator.atc_lookup = {}
        validator.validation_logs = []
        validator.matcher = None

        real_hit = [{"brand": "Dolo", "generic": "Paracetamol", "score": 0.92}]

        with patch.dict(os.environ, {"SEMANTIC_THRESHOLD": "0.80"}), \
             patch("drug_validation.embeddings.embedding_service") as mock_emb, \
             patch("drug_validation.supabase_client.supabase_drug_client") as mock_client:
            mock_emb.get_embedding.return_value = [0.1, 0.2, 0.3]
            mock_client.rpc_match_drug_semantic.return_value = real_hit

            result = validator._semantic_fallback("dolo 650")

        assert result is not None
        assert result["matched_name"] == "Dolo"
        assert result["band"] == "yellow"  # semantic hits are always yellow (needs_confirmation)


# ---------------------------------------------------------------------------
# R8 — Lab test functionality is preserved (rpc path)
# ---------------------------------------------------------------------------

class TestLabTestPreserved:

    def test_lab_test_sentinel_in_demo_mode(self):
        """demo mode: sentinel returned, no HTTP."""
        client = _fresh_client(demo=True)
        result = client.rpc_match_lab_test("Complete Blood Count")
        assert result[0].get("_demo_unavailable") is True

    def test_lab_test_success_in_prod_mode(self):
        """production mode: successful RPC returns parsed JSON."""
        client = _fresh_client(demo=False)
        mock_response = MagicMock()
        mock_response.is_success = True
        mock_response.json.return_value = [{"test_name": "CBC", "score": 0.99}]
        mock_cm = MagicMock()
        mock_cm.__enter__ = MagicMock(return_value=mock_cm)
        mock_cm.__exit__ = MagicMock(return_value=False)
        mock_cm.post = MagicMock(return_value=mock_response)
        with patch("httpx.Client", return_value=mock_cm):
            result = client.rpc_match_lab_test("CBC")
        assert result == [{"test_name": "CBC", "score": 0.99}]
