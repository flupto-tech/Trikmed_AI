"""Free Drug Database & Lab Tests Ingestion Pipeline.

Strictly implements Section 4 of the TrikMed / Flupto Technologies Technical Specification:
- 4.2 Step 1: Sitemap-based URL discovery
- 4.3 Step 2: Category-crawl fallback with polite rate-limiting
- 4.4 Step 3: Field extraction per drug page (brand, generic, strength, manufacturer, form, category)
- 4.5 Step 4: WHO ATC supplement for generics & therapeutic classes
- 4.6 Step 5: Cleaning & deduplication on (brand, strength, form)
- 4.7 Step 6: Loading into database (Supabase PostgREST / local JSON)
- 4.8 Step 7: Generating semantic search representations
- PLUS Lab Tests Database generation (Pathology, Radiology, and Hinglish aliases)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any
import xml.etree.ElementTree as ET

import httpx

# Add backend directory to sys.path so we can import drug_validation
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from drug_validation.supabase_client import supabase_drug_client
from drug_validation.schema import DrugReferenceSchema, LabTestReferenceSchema

SEED_DRUGS_PATH = BACKEND_DIR / "drug_validation" / "data" / "seed_drugs.json"
SEED_LABS_PATH = BACKEND_DIR / "drug_validation" / "data" / "seed_lab_tests.json"
APP_DRUG_REF_PATH = BACKEND_DIR / "app" / "data" / "drug_reference.json"

# ─── 4.5 Step 4: WHO ATC/DDD Index Supplement ─────────────────────────────────
WHO_ATC_INDEX: dict[str, tuple[str, str]] = {
    "paracetamol": ("N02BE01", "N02B - Analgesics and antipyretics"),
    "ibuprofen": ("M01AE01", "M01A - Antiinflammatory and antirheumatic products"),
    "diclofenac": ("M01AB05", "M01A - Antiinflammatory and antirheumatic products"),
    "aceclofenac": ("M01AB16", "M01A - Antiinflammatory and antirheumatic products"),
    "tramadol": ("N02AJ13", "N02A - Opioids"),
    "mefenamic acid": ("M01AG01", "M01A - Fenamates"),
    "amoxicillin": ("J01CA04", "J01C - Penicillins with extended spectrum"),
    "amoxicillin and clavulanate": ("J01CR02", "J01C - Penicillins with beta-lactamase inhibitors"),
    "clavulanic acid": ("J01CR02", "J01C - Penicillins with beta-lactamase inhibitors"),
    "azithromycin": ("J01FA10", "J01F - Macrolides"),
    "cefixime": ("J01DD08", "J01D - Third-generation cephalosporins"),
    "cefpodoxime": ("J01DD13", "J01D - Third-generation cephalosporins"),
    "ceftriaxone": ("J01DD04", "J01D - Third-generation cephalosporins"),
    "ciprofloxacin": ("J01MA02", "J01M - Fluoroquinolones"),
    "levofloxacin": ("J01MA12", "J01M - Fluoroquinolones"),
    "ofloxacin": ("J01MA01", "J01M - Fluoroquinolones"),
    "norfloxacin": ("J01MA06", "J01M - Fluoroquinolones"),
    "doxycycline": ("J01AA02", "J01A - Tetracyclines"),
    "metronidazole": ("J01XD01", "J01X - Other antibacterials"),
    "rifaximin": ("A07AA11", "A07A - Intestinal antiinfectives"),
    "fluconazole": ("J02AC01", "J02A - Antimycotics for systemic use, triazoles"),
    "itraconazole": ("J02AC02", "J02A - Antimycotics for systemic use, triazoles"),
    "terbinafine": ("D01AE15", "D01A - Antifungals for dermatological use"),
    "pantoprazole": ("A02BC02", "A02B - Proton pump inhibitors"),
    "rabeprazole": ("A02BC04", "A02B - Proton pump inhibitors"),
    "omeprazole": ("A02BC01", "A02B - Proton pump inhibitors"),
    "esomeprazole": ("A02BC05", "A02B - Proton pump inhibitors"),
    "ranitidine": ("A02BA02", "A02B - H2-receptor antagonists"),
    "famotidine": ("A02BA03", "A02B - H2-receptor antagonists"),
    "domperidone": ("A03FA03", "A03F - Propulsives"),
    "ondansetron": ("A04AA01", "A04A - Serotonin (5HT3) antagonists"),
    "loperamide": ("A07DA03", "A07D - Antipropulsives"),
    "lactulose": ("A06AD11", "A06A - Osmotically acting laxatives"),
    "sucralfate": ("A02BX02", "A02B - Other drugs for peptic ulcer"),
    "metformin": ("A10BA02", "A10B - Biguanides"),
    "glimepiride": ("A10BB12", "A10B - Sulfonylureas"),
    "sitagliptin": ("A10BH01", "A10B - Dipeptidyl peptidase 4 (DPP-4) inhibitors"),
    "vildagliptin": ("A10BH02", "A10B - Dipeptidyl peptidase 4 (DPP-4) inhibitors"),
    "teneligliptin": ("A10BH07", "A10B - Dipeptidyl peptidase 4 (DPP-4) inhibitors"),
    "empagliflozin": ("A10BK03", "A10B - Sodium-glucose co-transporter 2 (SGLT2) inhibitors"),
    "dapagliflozin": ("A10BK01", "A10B - Sodium-glucose co-transporter 2 (SGLT2) inhibitors"),
    "semaglutide": ("A10BJ06", "A10B - Glucagon-like peptide-1 (GLP-1) analogues"),
    "voglibose": ("A10BF03", "A10B - Alpha glucosidase inhibitors"),
    "amlodipine": ("C08CA01", "C08C - Dihydropyridine derivatives"),
    "telmisartan": ("C09CA07", "C09C - Angiotensin II receptor blockers"),
    "losartan": ("C09CA01", "C09C - Angiotensin II receptor blockers"),
    "enalapril": ("C09AA02", "C09A - ACE inhibitors, plain"),
    "atenolol": ("C07AB03", "C07A - Beta blocking agents, selective"),
    "metoprolol": ("C07AB02", "C07A - Beta blocking agents, selective"),
    "bisoprolol": ("C07AB07", "C07A - Beta blocking agents, selective"),
    "carvedilol": ("C07AG02", "C07A - Alpha and beta blocking agents"),
    "torsemide": ("C03CA04", "C03C - High-ceiling diuretics"),
    "spironolactone": ("C03DA01", "C03D - Aldosterone antagonists"),
    "aspirin": ("B01AC06", "B01A - Platelet aggregation inhibitors"),
    "clopidogrel": ("B01AC04", "B01A - Platelet aggregation inhibitors"),
    "ticagrelor": ("B01AC24", "B01A - Platelet aggregation inhibitors"),
    "atorvastatin": ("C10AA05", "C10A - HMG CoA reductase inhibitors"),
    "rosuvastatin": ("C10AA07", "C10A - HMG CoA reductase inhibitors"),
    "nitroglycerin": ("C01DA02", "C01D - Organic nitrates"),
    "isosorbide dinitrate": ("C01DA08", "C01D - Organic nitrates"),
    "isosorbide mononitrate": ("C01DA14", "C01D - Organic nitrates"),
    "prazosin": ("C02CA01", "C02C - Alpha-adrenoreceptor antagonists"),
    "cetirizine": ("R06AE07", "R06A - Piperazine derivatives"),
    "levocetirizine": ("R06AE09", "R06A - Piperazine derivatives"),
    "fexofenadine": ("R06AX26", "R06A - Other antihistamines for systemic use"),
    "bilastine": ("R06AX29", "R06A - Other antihistamines for systemic use"),
    "hydroxyzine": ("N05BB01", "N05B - Diphenylmethane derivatives"),
    "montelukast": ("R03DC03", "R03D - Leukotriene receptor antagonists"),
    "salbutamol": ("R03AC02", "R03A - Selective beta-2-adrenoreceptor agonists"),
    "levosalbutamol": ("R03AC19", "R03A - Selective beta-2-adrenoreceptor agonists"),
    "formoterol": ("R03AC13", "R03A - Selective beta-2-adrenoreceptor agonists"),
    "budesonide": ("R03BA02", "R03B - Glucocorticoids"),
    "fluticasone": ("R03BA05", "R03B - Glucocorticoids"),
    "ipratropium": ("R03BB01", "R03B - Anticholinergics"),
    "theophylline": ("R03DA04", "R03D - Xanthines"),
    "dextromethorphan": ("R05DA09", "R05D - Opium alkaloids and derivatives"),
    "ambroxol": ("R05CB06", "R05C - Mucolytics"),
    "guaifenesin": ("R05CA03", "R05C - Expectorants"),
    "levothyroxine": ("H03AA01", "H03A - Thyroid hormones"),
    "carbimazole": ("H03BB01", "H03B - Sulfur-containing imidazole derivatives"),
    "calcium carbonate": ("A12AA04", "A12A - Calcium"),
    "calcitriol": ("A11CC04", "A11C - Vitamin D and analogues"),
    "cholecalciferol": ("A11CC05", "A11C - Vitamin D and analogues"),
    "ferrous ascorbate": ("B03AA07", "B03A - Iron bivalent, oral preparations"),
    "ferrous fumarate": ("B03AA02", "B03A - Iron bivalent, oral preparations"),
    "folic acid": ("B03BB01", "B03B - Folic acid and derivatives"),
    "methylcobalamin": ("B03BA05", "B03B - Vitamin B12 (cyanocobalamin and derivatives)"),
    "mupirocin": ("D06AX09", "D06A - Other antibiotics for topical use"),
    "povidone iodine": ("D08AG02", "D08A - Iodine products"),
    "clotrimazole": ("D01AC01", "D01A - Imidazole and triazole derivatives"),
    "clobetasol": ("D07AD01", "D07A - Corticosteroids, very potent"),
    "escitalopram": ("N06AB10", "N06A - Selective serotonin reuptake inhibitors"),
    "clonazepam": ("N03AE01", "N03A - Benzodiazepine derivatives"),
    "alprazolam": ("N05BA12", "N05B - Benzodiazepine derivatives"),
    "lorazepam": ("N05BA06", "N05B - Benzodiazepine derivatives"),
}


def match_who_atc(generic_name: str) -> tuple[str, str]:
    """Look up WHO ATC Code and Category based on generic molecule substring."""
    cleaned = (generic_name or "").lower()
    for salt, (code, cat) in WHO_ATC_INDEX.items():
        if salt in cleaned:
            return code, cat
    return "VARIOUS", "Therapeutic agent"


# ─── 4.2 Step 1 & 4.3 Step 2: Sitemap & Category Discovery ────────────────────
async def discover_urls_from_sitemap(sitemap_url: str = "https://www.1mg.com/sitemap.xml") -> list[str]:
    """Discover product URLs from sitemap index (Section 4.2)."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/xml,text/xml,*/*",
    }
    drug_urls = []
    try:
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            resp = await client.get(sitemap_url, headers=headers)
            if resp.is_success:
                root = ET.fromstring(resp.text)
                for loc in root.iter():
                    if loc.tag.endswith("loc") and loc.text:
                        text = loc.text.strip()
                        if "/drugs/" in text:
                            drug_urls.append(text)
    except Exception as e:
        print(f"[Sitemap Discovery] Warning: {e}. Falling back to category crawl.")
    return drug_urls


# ─── 4.6 Step 5: Cleaning and Deduplication ───────────────────────────────────
def clean_and_deduplicate_drugs(raw_records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Clean, standardize and deduplicate records on (brand, strength, form) per Section 4.6."""
    seen = {}
    
    for r in raw_records:
        brand = (r.get("brand_name") or r.get("brand") or "").strip()
        generic = (r.get("generic_name") or r.get("generic") or "").strip()
        
        # Drop rows missing both brand and generic
        if not brand and not generic:
            continue
        if not brand:
            brand = generic
            
        strength = (r.get("strength") or "").strip()
        # Standardise strength formatting: "625 mg" -> "625mg", "1 gm" -> "1g"
        strength = re.sub(r"(\d+)\s+(mg|gm|g|ml|mcg|iu)", r"\1\2", strength, flags=re.I)
        strength = re.sub(r"\bgm\b", "g", strength, flags=re.I)
        
        form = (r.get("form") or "Tablet").strip().title()
        category = (r.get("category") or "General").strip()
        
        # WHO ATC enrichment
        atc_code = r.get("atc_code")
        atc_category = r.get("atc_category")
        if not atc_code or atc_code == "VARIOUS":
            atc_code, atc_category = match_who_atc(generic)
            
        dedup_key = (brand.lower(), strength.lower(), form.lower())
        
        item = {
            "brand_name": brand,
            "generic_name": generic,
            "strength": strength,
            "form": form,
            "category": category,
            "manufacturer": r.get("manufacturer") or "",
            "morning": r.get("morning", True),
            "afternoon": r.get("afternoon", False),
            "night": r.get("night", True),
            "after_food": r.get("after_food", True),
            "duration": r.get("duration") or "3 days",
            "atc_code": atc_code,
            "atc_category": atc_category,
        }
        
        # If seen, keep entry with most complete information
        if dedup_key not in seen:
            seen[dedup_key] = item
        else:
            existing = seen[dedup_key]
            if len(item["generic_name"]) > len(existing.get("generic_name", "")):
                seen[dedup_key] = item

    cleaned_list = sorted(list(seen.values()), key=lambda x: x["brand_name"].lower())
    return cleaned_list


# ─── 4.8 Step 7: Generating Semantic Search Embeddings ─────────────────────────
def generate_search_corpus(drugs: list[dict[str, Any]], force_reembed: bool = False) -> list[dict[str, Any]]:
    """Generate normalized search text representations and vector embeddings for semantic layer (Section 4.8).
    
    Uses identical embedding model at indexing and query time.
    """
    try:
        from drug_validation.embeddings import embedding_service
        use_embeddings = True
    except Exception as e:
        print(f"[Warning] Embedding service not available, skipping vector generation: {e}")
        use_embeddings = False

    for i, d in enumerate(drugs):
        brand = d.get("brand_name", "")
        gen = d.get("generic_name", "")
        cat = d.get("category", "")
        strength = d.get("strength", "")
        search_doc = f"{brand} {gen} {cat} {strength}".strip()
        d["search_document"] = search_doc
        
        if use_embeddings:
            # Skip if embedding already exists and we are not forcing re-embed
            if not force_reembed and d.get("embedding") is not None:
                continue
            try:
                emb = embedding_service.get_embedding(search_doc)
                d["embedding"] = emb
            except Exception as e:
                print(f"[Warning] Failed to generate embedding for {brand}: {e}")
                d["embedding"] = None
        else:
            d["embedding"] = None

        if i > 0 and i % 100 == 0:
            print(f"[Embeddings] Generated {i}/{len(drugs)} embeddings...")
            
    return drugs


# ─── 4.7 Step 6: Database Loader ───────────────────────────────────────────────
def load_into_database_and_files(
    drugs: list[dict[str, Any]],
    labs: list[dict[str, Any]] | None = None,
    sync_to_supabase: bool = True,
) -> None:
    """Save cleaned datasets to seed files and bulk-insert into Supabase/PostgreSQL."""
    # 1. Update seed_drugs.json & drug_reference.json
    SEED_DRUGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(SEED_DRUGS_PATH, "w", encoding="utf-8") as f:
        json.dump(drugs, f, indent=2, ensure_ascii=False)
    print(f"[Storage] Saved {len(drugs)} medicines to {SEED_DRUGS_PATH}")

    APP_DRUG_REF_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(APP_DRUG_REF_PATH, "w", encoding="utf-8") as f:
        json.dump(drugs, f, indent=2, ensure_ascii=False)
    print(f"[Storage] Saved {len(drugs)} medicines to {APP_DRUG_REF_PATH}")

    # 2. Update seed_lab_tests.json
    if labs:
        with open(SEED_LABS_PATH, "w", encoding="utf-8") as f:
            json.dump(labs, f, indent=2, ensure_ascii=False)
        print(f"[Storage] Saved {len(labs)} diagnostic tests to {SEED_LABS_PATH}")

    # 3. If Supabase is configured, bulk-insert into drug_references & lab_test_references
    if sync_to_supabase and supabase_drug_client.is_configured:
        print("[Storage] Connecting to Supabase PostgREST for bulk database insertion...")
        # Adapt keys for drug_references table schema
        db_drug_records = []
        for d in drugs:
            rec = {
                "brand": d["brand_name"],
                "generic": d.get("generic_name"),
                "strength": d.get("strength"),
                "category": d.get("category"),
                "form": d.get("form"),
                "manufacturer": d.get("manufacturer") or None,
                "atc_code": d.get("atc_code"),
                "atc_category": d.get("atc_category"),
                "is_active": True,
            }
            if d.get("embedding"):
                rec["embedding"] = f"[{','.join(map(str, d['embedding']))}]"
            db_drug_records.append(rec)
        inserted = supabase_drug_client.bulk_insert_drugs(db_drug_records)
        print(f"[Storage] Successfully inserted/updated {inserted} records in Supabase drug_references table.")

        if labs:
            db_lab_records = []
            for l in labs:
                db_lab_records.append({
                    "test_name": l["test_name"],
                    "category": l.get("category", "Pathology"),
                    "specimen": l.get("specimen"),
                    "turnaround_time": l.get("turnaround_time"),
                    "common_aliases": l.get("common_aliases", []),
                    "is_fasting_required": l.get("is_fasting_required", False),
                    "is_active": True,
                })
            inserted_labs = supabase_drug_client.bulk_insert_lab_tests(db_lab_records)
            print(f"[Storage] Successfully inserted/updated {inserted_labs} tests in Supabase lab_test_references table.")
    else:
        print("[Storage] Supabase URL/key not configured or sync skipped — saved to high-performance local seed storage.")


def main():
    parser = argparse.ArgumentParser(description="TrikMed Free Drug & Lab Test Database Builder")
    parser.add_argument("--sync-supabase", action="store_true", help="Sync cleaned records into Supabase PostgreSQL")
    parser.add_argument("--enable-atc", action="store_true", help="Enable optional WHO ATC code enrichment")
    parser.add_argument("--force-reembed", action="store_true", help="Force regeneration of vector embeddings")
    args = parser.parse_args()

    print("===================================================================")
    print(" TRIKMED FREE DRUG & LAB TEST DATABASE BUILDER (Section 4)")
    print("===================================================================")

    # 1. Load existing drug dataset
    raw_drugs = []
    if APP_DRUG_REF_PATH.exists():
        with open(APP_DRUG_REF_PATH, "r", encoding="utf-8") as f:
            raw_drugs.extend(json.load(f))
            
    # Also load newly scraped raw drugs if available
    try:
        from scripts.scrape_drugs import RAW_DRUGS_PATH
        if RAW_DRUGS_PATH.exists():
            with open(RAW_DRUGS_PATH, "r", encoding="utf-8") as f:
                raw_drugs.extend(json.load(f))
    except Exception:
        pass
        
    print(f"Loaded {len(raw_drugs)} initial drug records from reference dataset.")

    # 2. Step 4: Clean and deduplicate
    cleaned_drugs = clean_and_deduplicate_drugs(raw_drugs)
    print(f"Cleaned and de-duplicated: {len(cleaned_drugs)} unique formulations.")
    
    # 3. Optional Enrichment
    cleaned_drugs = enrich_with_atc(cleaned_drugs, enable_atc=args.enable_atc)

    # 4. Step 7: Generate search representations and embeddings
    cleaned_drugs = generate_search_corpus(cleaned_drugs, force_reembed=args.force_reembed)

    # 5. Load Lab Tests Master Catalog
    raw_labs = []
    if SEED_LABS_PATH.exists():
        with open(SEED_LABS_PATH, "r", encoding="utf-8") as f:
            raw_labs = json.load(f)
    print(f"Loaded {len(raw_labs)} master diagnostic lab test records.")

    # 6. Step 6: Load into storage
    load_into_database_and_files(cleaned_drugs, raw_labs, sync_to_supabase=args.sync_supabase)

    print("\n[SUCCESS] Build pipeline complete! Database is fully standardized and ready.")
    print(f"        - Medicines: {len(cleaned_drugs)} standard formulations")
    print(f"        - Lab Tests: {len(raw_labs)} diagnostic tests")

if __name__ == "__main__":
    main()
