from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
import re
from typing import Any
from rapidfuzz import fuzz, process

DRUG_DB_PATH = Path(__file__).resolve().parents[1] / 'data' / 'drug_reference.json'


class DrugValidator:
    def __init__(self, db_path: Path | str = DRUG_DB_PATH):
        self.db_path = Path(db_path)
        self.medicines: list[dict[str, Any]] = []
        self.brand_lookup: dict[str, dict[str, Any]] = {}
        self.brand_names: list[str] = []
        self.generic_lookup: dict[str, list[dict[str, Any]]] = {}
        self.atc_lookup: dict[str, list[dict[str, Any]]] = {}
        self.validation_logs: list[dict[str, Any]] = []
        self._load_database()

    def _load_database(self) -> None:
        if self.db_path.exists():
            with open(self.db_path, 'r', encoding='utf-8') as f:
                self.medicines = json.load(f)
            for med in self.medicines:
                bname = med.get('brand_name', '').strip()
                gname = med.get('generic_name', '').strip().lower()
                atc = med.get('atc_code', '').strip().upper()
                if bname:
                    self.brand_lookup[bname.lower()] = med
                    self.brand_names.append(bname)
                if gname:
                    self.generic_lookup.setdefault(gname, []).append(med)
                if atc and atc != 'VARIOUS':
                    self.atc_lookup.setdefault(atc, []).append(med)

    def _semantic_fallback(self, cleaned: str) -> dict[str, Any] | None:
        import os
        try:
            from drug_validation.embeddings import embedding_service
            from drug_validation.supabase_client import supabase_drug_client

            embedding = embedding_service.get_embedding(cleaned)
            if not embedding:
                return None
                
            hits = supabase_drug_client.rpc_match_drug_semantic(embedding)
            semantic_threshold = float(os.getenv("SEMANTIC_THRESHOLD", "0.80"))

            if hits and hits[0]["score"] >= semantic_threshold:
                hit = hits[0]
                return {
                    'raw_name': cleaned,
                    'matched_name': hit.get('brand'),
                    'generic_name': hit.get('generic'),
                    'atc_code': hit.get('atc_code'),
                    'atc_category': hit.get('category'),
                    'score': 0.75,
                    'band': 'yellow',
                    'auto_corrected': False,
                    'status': 'needs_confirmation',
                    'method': 'pgvector_semantic_fallback',
                    'details': hit,
                }
        except Exception:
            pass
        return None

    def validate_medicine_name(self, raw_name: str) -> dict[str, Any]:
        cleaned = (raw_name or '').strip()
        timestamp = datetime.now(timezone.utc).isoformat()

        if not cleaned or not self.brand_names:
            res = {
                'raw_name': raw_name,
                'matched_name': None,
                'score': 0.0,
                'band': 'red',
                'auto_corrected': False,
                'status': 'unverified',
                'method': 'empty',
                'timestamp': timestamp,
            }
            self.log_validation(res)
            return res

        normalized_query = cleaned
        for alias_pattern, replacement in [
            (r"\b(do\s*low|duo\s*low|dolow)\b", "Dolo"),
            (r"\b(ogmentin|augmenten|augmenton)\b", "Augmentin"),
            (r"\b(diploma\s*mall|diploma\s*mole|diplomall|diclomol|diclo\s*mol)\b", "Diclomol"),
            (r"\bpan\s*d\b", "Pan D"),
            (r"\bpant\s*40\b", "Pan 40"),
            (r"\bpan\s+40\b", "Pan 40"),
            (r"\bpantocid\b", "Pan 40"),
            (r"\b(nitro\s*glycerine|nitro\s*glycerin|nitroglycerin|nitroglycerine)\b", "Nitrocontin"),
            (r"\b(allegra\b)", "Allegra 120"),
            (r"\b(meftal\s*spas)\b", "Meftal-Spas"),
            (r"\b(montair\s*lc)\b", "Montair-LC"),
            (r"\b(taxim\s*o)\b", "Taxim-O"),
            (r"\b(ascoril\s*d)\b", "Ascoril-D"),
            (r"\b(livo\s*thyroxin|levo\s*thyroxin[e]?|livo\s*thyroxine|levothyroxin[e]?)\b", "Levothyroxine"),
        ]:
            normalized_query = re.sub(alias_pattern, replacement, normalized_query, flags=re.IGNORECASE)

        # 1. Fuzzy Brand Match (High Priority)
        candidates_to_score = [normalized_query] if normalized_query != cleaned else [cleaned]
        best_match_name = None
        highest_score = 0.0

        for q in candidates_to_score:
            m_sort = process.extractOne(q, self.brand_names, scorer=fuzz.token_sort_ratio)
            if m_sort and m_sort[1] > highest_score:
                best_match_name = m_sort[0]
                highest_score = float(m_sort[1])

        normalized_score = highest_score / 100.0

        if normalized_score >= 0.85 and best_match_name:
            res = {
                'raw_name': raw_name,
                'matched_name': best_match_name,
                'score': round(normalized_score, 3),
                'band': 'green',
                'auto_corrected': True,
                'status': 'verified',
                'method': 'fuzzy_match',
                'details': self.brand_lookup.get(best_match_name.lower()),
                'timestamp': timestamp,
            }
            self.log_validation(res)
            return res

        elif normalized_score >= 0.70 and best_match_name:
            res = {
                'raw_name': raw_name,
                'matched_name': best_match_name,
                'score': round(normalized_score, 3),
                'band': 'yellow',
                'auto_corrected': False,
                'status': 'needs_confirmation',
                'method': 'fuzzy_match',
                'details': self.brand_lookup.get(best_match_name.lower()),
                'timestamp': timestamp,
            }
            self.log_validation(res)
            return res

        # 2. Generic Name Match (Lower Priority)
        generic_names = list(self.generic_lookup)
        generic_hit = process.extractOne(normalized_query.lower(), generic_names, scorer=fuzz.token_sort_ratio)
        if generic_hit and float(generic_hit[1]) >= 70:
            generic_name = generic_hit[0]
            representative = self.generic_lookup[generic_name][0]
            score = min(float(generic_hit[1]) / 100.0, 0.84)
            res = {
                'raw_name': raw_name,
                'matched_name': representative.get('brand_name'),
                'generic_name': representative.get('generic_name'),
                'score': round(score, 3),
                'band': 'yellow',
                'auto_corrected': False,
                'status': 'needs_confirmation',
                'method': 'generic_fuzzy_candidate',
                'details': representative,
                'timestamp': timestamp,
            }
            self.log_validation(res)
            return res

        # 3. Semantic Fallback
        fallback_res = self._semantic_fallback(normalized_query)
        if fallback_res:
            fallback_res['timestamp'] = timestamp
            self.log_validation(fallback_res)
            return fallback_res

        res = {
            'raw_name': raw_name,
            'matched_name': None,
            'score': round(normalized_score, 3),
            'band': 'red',
            'auto_corrected': False,
            'status': 'unverified',
            'method': 'unmatched',
            'timestamp': timestamp,
        }
        self.log_validation(res)
        return res

    def validate_lab_test(self, test_name: str) -> dict[str, Any]:
        from drug_validation.matcher import lab_test_matcher
        res = lab_test_matcher.match(test_name)
        return {
            "raw_name": res.raw_text,
            "matched_name": res.matched_name or test_name,
            "category": res.category,
            "specimen": res.specimen,
            "is_fasting_required": res.is_fasting_required,
            "score": res.score,
            "band": res.band,
            "status": res.status,
        }

    def extract_lab_tests(self, text: str) -> list[dict[str, Any]]:
        from drug_validation.matcher import lab_test_matcher
        results = lab_test_matcher.extract_from_text(text)
        return [
            {
                "raw_name": r.raw_text,
                "matched_name": r.matched_name or r.raw_text,
                "category": r.category,
                "specimen": r.specimen,
                "is_fasting_required": r.is_fasting_required,
                "score": r.score,
                "band": r.band,
                "status": r.status,
            }
            for r in results
        ]

    def get_drug_context_for_prompt(self, limit: int = 40) -> str:
        return ", ".join(self.brand_names[:limit])

    def log_validation(self, result: dict[str, Any]) -> None:
        self.validation_logs.append(result)


drug_validator = DrugValidator()
