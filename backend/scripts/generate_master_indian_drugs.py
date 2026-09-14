"""Generate comprehensive Master Indian Drug Catalog with WHO ATC classifications.

Merges:
1. High-frequency clinical formulary from frontend/lib/medicines-data.js
2. Existing WHO ATC-enriched reference formulations
3. Top Indian pharmaceutical market formulations across all major therapeutic categories
"""

from __future__ import annotations
import json
import re
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DATA_PATH = BACKEND_DIR.parent / "frontend" / "lib" / "medicines-data.js"
OUTPUT_JSON_PATH = BACKEND_DIR / "app" / "data" / "drug_reference.json"

# Master WHO ATC Map for common active molecules
ATC_MAP: dict[str, tuple[str, str]] = {
    "paracetamol": ("N02BE01", "N02B - Analgesics and antipyretics"),
    "ibuprofen": ("M01AE01", "M01A - Antiinflammatory and antirheumatic products"),
    "diclofenac": ("M01AB05", "M01A - Antiinflammatory and antirheumatic products"),
    "aceclofenac": ("M01AB16", "M01A - Antiinflammatory and antirheumatic products"),
    "tramadol": ("N02AJ13", "N02A - Opioids"),
    "amoxicillin": ("J01CA04", "J01C - Beta-lactam antibacterials, penicillins"),
    "clavulanic": ("J01CR02", "J01C - Penicillins with beta-lactamase inhibitors"),
    "azithromycin": ("J01FA10", "J01F - Macrolides"),
    "cefixime": ("J01DD08", "J01D - Other beta-lactam antibacterials, cephalosporins"),
    "cefpodoxime": ("J01DD13", "J01D - Other beta-lactam antibacterials, cephalosporins"),
    "ceftriaxone": ("J01DD04", "J01D - Other beta-lactam antibacterials, cephalosporins"),
    "ciprofloxacin": ("J01MA02", "J01M - Quinolone antibacterials"),
    "levofloxacin": ("J01MA12", "J01M - Quinolone antibacterials"),
    "doxycycline": ("J01AA02", "J01A - Tetracyclines"),
    "metronidazole": ("J01XD01", "J01X - Other antibacterials"),
    "pantoprazole": ("A02BC02", "A02B - Drugs for peptic ulcer and GORD"),
    "rabeprazole": ("A02BC04", "A02B - Drugs for peptic ulcer and GORD"),
    "omeprazole": ("A02BC01", "A02B - Drugs for peptic ulcer and GORD"),
    "esomeprazole": ("A02BC05", "A02B - Drugs for peptic ulcer and GORD"),
    "domperidone": ("A03FA03", "A03F - Propulsives"),
    "ondansetron": ("A04AA01", "A04A - Antiemetics and antinauseants"),
    "metformin": ("A10BA02", "A10B - Blood glucose lowering drugs"),
    "glimepiride": ("A10BB12", "A10B - Blood glucose lowering drugs"),
    "sitagliptin": ("A10BH01", "A10B - Dipeptidyl peptidase 4 (DPP-4) inhibitors"),
    "vildagliptin": ("A10BH02", "A10B - Dipeptidyl peptidase 4 (DPP-4) inhibitors"),
    "teneligliptin": ("A10BH07", "A10B - Dipeptidyl peptidase 4 (DPP-4) inhibitors"),
    "empagliflozin": ("A10BK03", "A10B - SGLT2 inhibitors"),
    "dapagliflozin": ("A10BK01", "A10B - SGLT2 inhibitors"),
    "amlodipine": ("C08CA01", "C08C - Selective calcium channel blockers"),
    "telmisartan": ("C09CA07", "C09C - Angiotensin II receptor blockers (ARBs)"),
    "losartan": ("C09CA01", "C09C - Angiotensin II receptor blockers (ARBs)"),
    "enalapril": ("C09AA02", "C09A - ACE inhibitors"),
    "atenolol": ("C07AB03", "C07A - Beta blocking agents"),
    "metoprolol": ("C07AB02", "C07A - Beta blocking agents"),
    "torsemide": ("C03CA04", "C03C - High-ceiling diuretics"),
    "aspirin": ("B01AC06", "B01A - Antithrombotic agents"),
    "clopidogrel": ("B01AC04", "B01A - Antithrombotic agents"),
    "atorvastatin": ("C10AA05", "C10A - Lipid modifying agents, statins"),
    "rosuvastatin": ("C10AA07", "C10A - Lipid modifying agents, statins"),
    "nitroglycerin": ("C01DA02", "C01D - Vasodilators used in cardiac diseases"),
    "isosorbide": ("C01DA08", "C01D - Vasodilators used in cardiac diseases"),
    "cetirizine": ("R06AE07", "R06A - Antihistamines for systemic use"),
    "levocetirizine": ("R06AE09", "R06A - Antihistamines for systemic use"),
    "fexofenadine": ("R06AX26", "R06A - Antihistamines for systemic use"),
    "montelukast": ("R03DC03", "R03D - Other systemic drugs for obstructive airway diseases"),
    "salbutamol": ("R03AC02", "R03A - Adrenergics, inhalants"),
    "budesonide": ("R03BA02", "R03B - Other drugs for obstructive airway diseases, inhalants"),
    "formoterol": ("R03AK07", "R03A - Formoterol and budesonide"),
    "levothyroxine": ("H03AA01", "H03A - Thyroid preparations"),
    "calcium": ("A12AA04", "A12A - Calcium"),
    "vitamin d": ("A11CC05", "A11C - Vitamin A and D, incl. combinations"),
    "folic acid": ("B03BB01", "B03B - Vitamin B12 and folic acid"),
    "methylcobalamin": ("B03BA05", "B03B - Vitamin B12 and folic acid"),
    "mupirocin": ("D06AX09", "D06A - Antibiotics for topical use"),
    "povidone iodine": ("D08AG02", "D08A - Antiseptics and disinfectants"),
    "clotrimazole": ("D01AC01", "D01A - Antifungals for dermatological use"),
}


def get_atc_info(generic_name: str) -> tuple[str, str]:
    g_lower = generic_name.lower()
    for key, val in ATC_MAP.items():
        if key in g_lower:
            return val
    return ("VARIOUS", "Therapeutic agent")


def parse_dosage(dosage_str: str) -> tuple[bool, bool, bool]:
    d = dosage_str.strip().lower()
    if d in ("1-1-1", "1-1-1-1", "tds", "tid"):
        return True, True, True
    if d in ("1-0-1", "bd", "bid", "twice"):
        return True, False, True
    if d in ("1-0-0", "od morning", "morning"):
        return True, False, False
    if d in ("0-0-1", "hs", "bedtime", "night"):
        return False, False, True
    if d in ("0-1-0", "afternoon"):
        return False, True, False
    return True, False, True


def parse_timing(timing_str: str) -> bool:
    t = timing_str.lower()
    return not ("empty" in t or "before" in t or "khali" in t)


def main():
    merged_catalog: dict[str, dict] = {}

    # 1. Load existing drug_reference.json
    if OUTPUT_JSON_PATH.exists():
        try:
            with open(OUTPUT_JSON_PATH, "r", encoding="utf-8") as f:
                existing = json.load(f)
                for item in existing:
                    name = item.get("brand_name")
                    if name:
                        merged_catalog[name.lower()] = item
            print(f"Loaded {len(merged_catalog)} existing records from drug_reference.json")
        except Exception as e:
            print(f"Error loading existing drug_reference.json: {e}")

    # 2. Extract medicines from frontend/lib/medicines-data.js
    if FRONTEND_DATA_PATH.exists():
        content = FRONTEND_DATA_PATH.read_text(encoding="utf-8")
        pattern = re.compile(
            r"brandName:\s*['\"]([^'\"]+)['\"],\s*genericName:\s*['\"]([^'\"]+)['\"],\s*strengths:\s*\[([^\]]*)\],\s*form:\s*['\"]([^'\"]+)['\"],\s*category:\s*['\"]([^'\"]+)['\"],\s*defaultDosage:\s*['\"]([^'\"]+)['\"],\s*defaultTiming:\s*['\"]([^'\"]+)['\"],\s*defaultDuration:\s*['\"]([^'\"]+)['\"]",
            re.MULTILINE
        )
        matches = pattern.findall(content)
        print(f"Found {len(matches)} structured medicines in medicines-data.js")

        for bname, gname, strengths_str, form, cat, dosage, timing, dur in matches:
            strengths = [s.strip().replace("'", "").replace('"', '') for s in strengths_str.split(",") if s.strip()]
            main_strength = strengths[0] if strengths else ""
            morn, aft, night = parse_dosage(dosage)
            after_food = parse_timing(timing)
            atc_code, atc_cat = get_atc_info(gname)

            entry = {
                "brand_name": bname.strip(),
                "generic_name": gname.strip(),
                "strength": main_strength,
                "form": form.strip(),
                "category": cat.strip(),
                "morning": morn,
                "afternoon": aft,
                "night": night,
                "after_food": after_food,
                "duration": dur.strip() or "3 days",
                "atc_code": atc_code,
                "atc_category": atc_cat,
            }
            merged_catalog[bname.strip().lower()] = entry

            # Also create specific strength variants if multiple strengths exist (e.g. "Telma 40", "Telma 80")
            for s in strengths:
                if s and s not in bname:
                    variant_name = f"{bname.strip()} {s}"
                    variant_entry = dict(entry)
                    variant_entry["brand_name"] = variant_name
                    variant_entry["strength"] = s
                    merged_catalog[variant_name.lower()] = variant_entry

    # 3. Add extensive top Indian pharmaceutical formulations across all major therapeutic classes
    ADDITIONAL_INDIAN_FORMULATIONS = [
        # Cardiovascular & Hypertension
        ("Telma 20", "Telmisartan", "20mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Telma 40", "Telmisartan", "40mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Telma 80", "Telmisartan", "80mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Telma-H", "Telmisartan + Hydrochlorothiazide", "40mg+12.5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Telma-AM", "Telmisartan + Amlodipine", "40mg+5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Telmikind 40", "Telmisartan", "40mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Telmikind-AM", "Telmisartan + Amlodipine", "40mg+5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Tazloc 40", "Telmisartan", "40mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Tazloc-AM", "Telmisartan + Amlodipine", "40mg+5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Amlokind 5", "Amlodipine", "5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Amlokind 10", "Amlodipine", "10mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Amlopres 5", "Amlodipine", "5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Stamlo 5", "Amlodipine", "5mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Stamlo 10", "Amlodipine", "10mg", "Tablet", "Hypertension", True, False, False, True, "30 days"),
        ("Tenolol 50", "Atenolol", "50mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Tenolol 25", "Atenolol", "25mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Betaloc 25", "Metoprolol Succinate", "25mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Betaloc 50", "Metoprolol Succinate", "50mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Starpress XL 25", "Metoprolol Succinate", "25mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Starpress XL 50", "Metoprolol Succinate", "50mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Concor 5", "Bisoprolol", "5mg", "Tablet", "Cardiac", True, False, False, True, "30 days"),
        ("Cardivas 3.125", "Carvedilol", "3.125mg", "Tablet", "Cardiac", True, False, True, True, "30 days"),
        ("Cardivas 6.25", "Carvedilol", "6.25mg", "Tablet", "Cardiac", True, False, True, True, "30 days"),
        ("Atorva 10", "Atorvastatin", "10mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Atorva 20", "Atorvastatin", "20mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Atorva 40", "Atorvastatin", "40mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Storvas 10", "Atorvastatin", "10mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Storvas 20", "Atorvastatin", "20mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Rosuvas 10", "Rosuvastatin", "10mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Rosuvas 20", "Rosuvastatin", "20mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Rozavel 10", "Rosuvastatin", "10mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Rozavel 20", "Rosuvastatin", "20mg", "Tablet", "Lipid-lowering", False, False, True, True, "30 days"),
        ("Ecosprin 75", "Aspirin", "75mg", "Tablet", "Antiplatelet", True, False, False, True, "30 days"),
        ("Ecosprin 150", "Aspirin", "150mg", "Tablet", "Antiplatelet", True, False, False, True, "30 days"),
        ("Ecosprin AV 75", "Aspirin + Atorvastatin", "75mg+10mg", "Capsule", "Antiplatelet/Lipid", False, False, True, True, "30 days"),
        ("Clopilet 75", "Clopidogrel", "75mg", "Tablet", "Antiplatelet", True, False, False, True, "30 days"),
        ("Deplatt 75", "Clopidogrel", "75mg", "Tablet", "Antiplatelet", True, False, False, True, "30 days"),
        ("Deplatt-A", "Clopidogrel + Aspirin", "75mg+75mg", "Capsule", "Antiplatelet", True, False, False, True, "30 days"),
        ("Brilinta 90", "Ticagrelor", "90mg", "Tablet", "Antiplatelet", True, False, True, True, "30 days"),
        ("Nitrocontin 2.6", "Nitroglycerin", "2.6mg", "Tablet", "Antianginal", True, False, True, True, "3 days"),
        ("Nitrocontin 6.4", "Nitroglycerin", "6.4mg", "Tablet", "Antianginal", True, False, True, True, "3 days"),
        ("Sorbitrate 5", "Isosorbide Dinitrate", "5mg", "Tablet", "Antianginal", True, False, True, False, "5 days"),
        ("Sorbitrate 10", "Isosorbide Dinitrate", "10mg", "Tablet", "Antianginal", True, False, True, False, "5 days"),
        ("Minipress XL 2.5", "Prazosin", "2.5mg", "Tablet", "Antihypertensive", False, False, True, True, "30 days"),
        ("Minipress XL 5", "Prazosin", "5mg", "Tablet", "Antihypertensive", False, False, True, True, "30 days"),
        ("Dytor 10", "Torsemide", "10mg", "Tablet", "Diuretic", True, False, False, True, "30 days"),
        ("Dytor 20", "Torsemide", "20mg", "Tablet", "Diuretic", True, False, False, True, "30 days"),
        ("Dytor Plus 10", "Torsemide + Spironolactone", "10mg+50mg", "Tablet", "Diuretic", True, False, False, True, "30 days"),
        ("Arkamin", "Clonidine", "100mcg", "Tablet", "Antihypertensive", True, False, True, True, "30 days"),

        # Diabetes & Metabolism
        ("Glycomet 500", "Metformin", "500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Glycomet 850", "Metformin", "850mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Glycomet 1g", "Metformin", "1000mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Glycomet GP 1", "Glimepiride + Metformin", "1mg+500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Glycomet GP 2", "Glimepiride + Metformin", "2mg+500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Amaryl 1", "Glimepiride", "1mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Amaryl 2", "Glimepiride", "2mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Glimestar 1", "Glimepiride", "1mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Glimestar 2", "Glimepiride", "2mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Januvia 50", "Sitagliptin", "50mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Januvia 100", "Sitagliptin", "100mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Janumet 50/500", "Sitagliptin + Metformin", "50mg+500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Janumet 50/1000", "Sitagliptin + Metformin", "50mg+1000mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Galvus 50", "Vildagliptin", "50mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Galvus Met 50/500", "Vildagliptin + Metformin", "50mg+500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Galvus Met 50/850", "Vildagliptin + Metformin", "50mg+850mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Jalra 50", "Vildagliptin", "50mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Jalra-M 50/500", "Vildagliptin + Metformin", "50mg+500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Zita 50", "Teneligliptin", "50mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Tenepure 20", "Teneligliptin", "20mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Tenepure-M", "Teneligliptin + Metformin", "20mg+500mg", "Tablet", "Diabetes", True, False, True, True, "30 days"),
        ("Jardiance 10", "Empagliflozin", "10mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Jardiance 25", "Empagliflozin", "25mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Forxiga 5", "Dapagliflozin", "5mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Forxiga 10", "Dapagliflozin", "10mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Oxra 10", "Dapagliflozin", "10mg", "Tablet", "Diabetes", True, False, False, True, "30 days"),
        ("Rybelsus 3", "Semaglutide", "3mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Rybelsus 7", "Semaglutide", "7mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Rybelsus 14", "Semaglutide", "14mg", "Tablet", "Diabetes", True, False, False, False, "30 days"),
        ("Voglibose 0.2", "Voglibose", "0.2mg", "Tablet", "Diabetes", True, True, True, False, "30 days"),
        ("Voglibose 0.3", "Voglibose", "0.3mg", "Tablet", "Diabetes", True, True, True, False, "30 days"),
        ("Volibo 0.2", "Voglibose", "0.2mg", "Tablet", "Diabetes", True, True, True, False, "30 days"),
        ("Volibo 0.3", "Voglibose", "0.3mg", "Tablet", "Diabetes", True, True, True, False, "30 days"),

        # Thyroid
        ("Thyronorm 12.5", "Levothyroxine", "12.5mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 25", "Levothyroxine", "25mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 50", "Levothyroxine", "50mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 75", "Levothyroxine", "75mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 88", "Levothyroxine", "88mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 100", "Levothyroxine", "100mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 112", "Levothyroxine", "112mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 125", "Levothyroxine", "125mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Thyronorm 150", "Levothyroxine", "150mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Eltroxin 25", "Levothyroxine", "25mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Eltroxin 50", "Levothyroxine", "50mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Eltroxin 100", "Levothyroxine", "100mcg", "Tablet", "Thyroid", True, False, False, False, "90 days"),
        ("Neomercazole 5", "Carbimazole", "5mg", "Tablet", "Thyroid", True, True, True, True, "30 days"),

        # Antibiotics & Antifungals
        ("Augmentin 375", "Amoxicillin + Clavulanic Acid", "375mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Augmentin 625", "Amoxicillin + Clavulanic Acid", "625mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Augmentin 1g", "Amoxicillin + Clavulanic Acid", "1000mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Augmentin Duo Oral Suspension", "Amoxicillin + Clavulanic Acid", "228.5mg/5ml", "Syrup", "Antibiotic", True, False, True, True, "5 days"),
        ("Clavam 375", "Amoxicillin + Clavulanic Acid", "375mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Clavam 625", "Amoxicillin + Clavulanic Acid", "625mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Clavam Forte Syrup", "Amoxicillin + Clavulanic Acid", "457mg/5ml", "Syrup", "Antibiotic", True, False, True, True, "5 days"),
        ("Moxikind-CV 625", "Amoxicillin + Clavulanic Acid", "625mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Azithral 250", "Azithromycin", "250mg", "Tablet", "Antibiotic", True, False, False, False, "3 days"),
        ("Azithral 500", "Azithromycin", "500mg", "Tablet", "Antibiotic", True, False, False, False, "3 days"),
        ("Azithral Liquid 200", "Azithromycin", "200mg/5ml", "Syrup", "Antibiotic", True, False, False, False, "3 days"),
        ("Azee 500", "Azithromycin", "500mg", "Tablet", "Antibiotic", True, False, False, False, "3 days"),
        ("Zithromax 500", "Azithromycin", "500mg", "Tablet", "Antibiotic", True, False, False, False, "3 days"),
        ("Taxim-O 100", "Cefixime", "100mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Taxim-O 200", "Cefixime", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Taxim-O CV", "Cefixime + Clavulanic Acid", "200mg+125mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Zifi 100", "Cefixime", "100mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Zifi 200", "Cefixime", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Mahacef 200", "Cefixime", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Cefpodoxime 100", "Cefpodoxime Proxetil", "100mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Cefpodoxime 200", "Cefpodoxime Proxetil", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Monocef-O 200", "Cefpodoxime Proxetil", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Doxcef 200", "Cefpodoxime Proxetil", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Monocef 500", "Ceftriaxone", "500mg", "Injection", "Antibiotic", True, False, False, False, "5 days"),
        ("Monocef 1g", "Ceftriaxone", "1g", "Injection", "Antibiotic", True, False, False, False, "5 days"),
        ("Monocef 2g", "Ceftriaxone", "2g", "Injection", "Antibiotic", True, False, False, False, "5 days"),
        ("Cifran 250", "Ciprofloxacin", "250mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Cifran 500", "Ciprofloxacin", "500mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Ciplox 500", "Ciprofloxacin", "500mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Ciplox Eye Drops", "Ciprofloxacin", "0.3%", "Drops", "Antibiotic", True, True, True, True, "5 days"),
        ("Levoflox 500", "Levofloxacin", "500mg", "Tablet", "Antibiotic", True, False, False, True, "5 days"),
        ("Levoflox 750", "Levofloxacin", "750mg", "Tablet", "Antibiotic", True, False, False, True, "5 days"),
        ("Loxof 500", "Levofloxacin", "500mg", "Tablet", "Antibiotic", True, False, False, True, "5 days"),
        ("Oflox 200", "Ofloxacin", "200mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Oflox-OZ", "Ofloxacin + Ornidazole", "200mg+500mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Zenflox-OZ", "Ofloxacin + Ornidazole", "200mg+500mg", "Tablet", "Antibiotic", True, False, True, True, "5 days"),
        ("Norflox-TZ", "Norfloxacin + Tinidazole", "400mg+600mg", "Tablet", "Antibiotic", True, False, True, True, "3 days"),
        ("Doxy-1", "Doxycycline", "100mg", "Capsule", "Antibiotic", True, False, True, True, "7 days"),
        ("Doxy-L", "Doxycycline + Lactic Acid Bacillus", "100mg", "Capsule", "Antibiotic", True, False, True, True, "7 days"),
        ("Flagyl 200", "Metronidazole", "200mg", "Tablet", "Antibiotic", True, True, True, True, "5 days"),
        ("Flagyl 400", "Metronidazole", "400mg", "Tablet", "Antibiotic", True, True, True, True, "5 days"),
        ("Metrogyl 400", "Metronidazole", "400mg", "Tablet", "Antibiotic", True, True, True, True, "5 days"),
        ("Rifaximin 400", "Rifaximin", "400mg", "Tablet", "Antibiotic", True, True, True, True, "7 days"),
        ("Rifagut 400", "Rifaximin", "400mg", "Tablet", "Antibiotic", True, True, True, True, "7 days"),
        ("Rifagut 550", "Rifaximin", "550mg", "Tablet", "Antibiotic", True, False, True, True, "14 days"),
        ("Forcan 150", "Fluconazole", "150mg", "Tablet", "Antifungal", True, False, False, True, "Single dose"),
        ("Diflucan 150", "Fluconazole", "150mg", "Tablet", "Antifungal", True, False, False, True, "Single dose"),
        ("Sporanox 100", "Itraconazole", "100mg", "Capsule", "Antifungal", True, False, True, True, "14 days"),
        ("Canditral 100", "Itraconazole", "100mg", "Capsule", "Antifungal", True, False, True, True, "14 days"),
        ("Canditral 200", "Itraconazole", "200mg", "Capsule", "Antifungal", True, False, False, True, "14 days"),
        ("Terbicip 250", "Terbinafine", "250mg", "Tablet", "Antifungal", True, False, False, True, "14 days"),

        # Gastrointestinal, Antacids & PPIs
        ("Pan 20", "Pantoprazole", "20mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pan 40", "Pantoprazole", "40mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pan-D", "Pantoprazole + Domperidone", "40mg+30mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pan-L", "Pantoprazole + Levosulpiride", "40mg+75mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pantocid 20", "Pantoprazole", "20mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pantocid 40", "Pantoprazole", "40mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pantocid DSR", "Pantoprazole + Domperidone", "40mg+30mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pantodac 40", "Pantoprazole", "40mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Pantodac DSR", "Pantoprazole + Domperidone", "40mg+30mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Omez 20", "Omeprazole", "20mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Omez 40", "Omeprazole", "40mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Omez-D", "Omeprazole + Domperidone", "20mg+10mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Razo 20", "Rabeprazole", "20mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Razo-D", "Rabeprazole + Domperidone", "20mg+30mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Razo-L", "Rabeprazole + Levosulpiride", "20mg+75mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Rabicip 20", "Rabeprazole", "20mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Rabicip-D", "Rabeprazole + Domperidone", "20mg+30mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Nexpro 40", "Esomeprazole", "40mg", "Tablet", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Nexpro RD 40", "Esomeprazole + Domperidone", "40mg+30mg", "Capsule", "Antacid/PPI", True, False, False, False, "14 days"),
        ("Aciloc 150", "Ranitidine", "150mg", "Tablet", "Antacid", True, False, True, False, "7 days"),
        ("Aciloc 300", "Ranitidine", "300mg", "Tablet", "Antacid", False, False, True, False, "7 days"),
        ("Rantac 150", "Ranitidine", "150mg", "Tablet", "Antacid", True, False, True, False, "7 days"),
        ("Famocid 40", "Famotidine", "40mg", "Tablet", "Antacid", False, False, True, False, "14 days"),
        ("Mucaine Gel", "Oxetacaine + Aluminium + Magnesium", "10ml", "Syrup", "Antacid", True, True, True, False, "7 days"),
        ("Digene Gel", "Aluminium + Magnesium + Simethicone", "10ml", "Syrup", "Antacid", True, True, True, True, "7 days"),
        ("Gelusil MPS", "Aluminium + Magnesium + Dimethicone", "10ml", "Syrup", "Antacid", True, True, True, True, "7 days"),
        ("Sucrafil Suspension", "Sucralfate", "1g/5ml", "Syrup", "Anti-ulcer", True, True, True, False, "14 days"),
        ("Sucrafil-O", "Sucralfate + Oxetacaine", "1g+20mg/5ml", "Syrup", "Anti-ulcer", True, True, True, False, "14 days"),
        ("Vomikind 4", "Ondansetron", "4mg", "Tablet", "Antiemetic", True, True, True, False, "3 days"),
        ("Vomikind MD 4", "Ondansetron", "4mg", "Tablet", "Antiemetic", True, True, True, False, "3 days"),
        ("Emeset 4", "Ondansetron", "4mg", "Tablet", "Antiemetic", True, True, True, False, "3 days"),
        ("Emeset 8", "Ondansetron", "8mg", "Tablet", "Antiemetic", True, False, True, False, "3 days"),
        ("Domstal 10", "Domperidone", "10mg", "Tablet", "Prokinetic", True, True, True, False, "5 days"),
        ("Ganaton 50", "Itopride", "50mg", "Tablet", "Prokinetic", True, True, True, False, "14 days"),
        ("Eldoper 2", "Loperamide", "2mg", "Capsule", "Antidiarrheal", True, True, True, True, "2 days"),
        ("Lopamide", "Loperamide", "2mg", "Tablet", "Antidiarrheal", True, True, True, True, "2 days"),
        ("Duphalac Syrup", "Lactulose", "10g/15ml", "Syrup", "Laxative", False, False, True, True, "7 days"),
        ("Cremaffin Liquid", "Liquid Paraffin + Magnesium Hydroxide", "15ml", "Syrup", "Laxative", False, False, True, True, "7 days"),
        ("Cremaffin Plus", "Liquid Paraffin + Mag Hydroxide + Sodium Picosulfate", "15ml", "Syrup", "Laxative", False, False, True, True, "7 days"),
        ("Dulcolax 5", "Bisacodyl", "5mg", "Tablet", "Laxative", False, False, True, False, "3 days"),
        ("Peglec Powder", "Polyethylene Glycol", "137.15g", "Powder", "Bowel Prep", True, False, False, False, "1 day"),
        ("Enterogermina", "Bacillus Clausii", "2 Billion Spores/5ml", "Ampoule", "Probiotic", True, False, True, True, "5 days"),
        ("Vibact-DS", "Probiotics + Prebiotics", "1 Capsule", "Capsule", "Probiotic", True, False, True, True, "5 days"),
        ("Econorm 250", "Saccharomyces Boulardii", "250mg", "Sachet", "Probiotic", True, False, True, True, "5 days"),

        # Respiratory & Pulmonology
        ("Foracort 200", "Formoterol + Budesonide", "6mcg+200mcg", "Inhaler", "Respiratory", True, False, True, False, "30 days"),
        ("Foracort 400", "Formoterol + Budesonide", "6mcg+400mcg", "Inhaler", "Respiratory", True, False, True, False, "30 days"),
        ("Budecort 200", "Budesonide", "200mcg", "Inhaler", "Respiratory", True, False, True, False, "30 days"),
        ("Budecort 0.5 Respules", "Budesonide", "0.5mg/2ml", "Respule", "Nebulizer", True, False, True, False, "5 days"),
        ("Budecort 1mg Respules", "Budesonide", "1mg/2ml", "Respule", "Nebulizer", True, False, True, False, "5 days"),
        ("Asthalin 100", "Salbutamol", "100mcg", "Inhaler", "Bronchodilator", True, False, True, False, "SOS"),
        ("Asthalin Respules", "Salbutamol", "2.5mg/2.5ml", "Respule", "Nebulizer", True, False, True, False, "5 days"),
        ("Duolin Respules", "Levosalbutamol + Ipratropium", "1.25mg+500mcg", "Respule", "Nebulizer", True, False, True, False, "5 days"),
        ("Duolin Inhaler", "Levosalbutamol + Ipratropium", "50mcg+20mcg", "Inhaler", "Bronchodilator", True, False, True, False, "30 days"),
        ("Seroflo 125", "Salmeterol + Fluticasone", "25mcg+125mcg", "Inhaler", "Respiratory", True, False, True, False, "30 days"),
        ("Seroflo 250", "Salmeterol + Fluticasone", "25mcg+250mcg", "Inhaler", "Respiratory", True, False, True, False, "30 days"),
        ("Deriphyllin 150", "Theophylline + Etofylline", "150mg", "Tablet", "Bronchodilator", True, False, True, True, "5 days"),
        ("Deriphyllin 300", "Theophylline + Etofylline", "300mg", "Tablet", "Bronchodilator", True, False, True, True, "5 days"),
        ("Deriphyllin Retard 150", "Theophylline + Etofylline", "150mg", "Tablet", "Bronchodilator", True, False, True, True, "30 days"),
        ("Deriphyllin Retard 300", "Theophylline + Etofylline", "300mg", "Tablet", "Bronchodilator", True, False, True, True, "30 days"),
        ("Montair 10", "Montelukast", "10mg", "Tablet", "Antiallergic", False, False, True, True, "30 days"),
        ("Montair-LC", "Montelukast + Levocetirizine", "10mg+5mg", "Tablet", "Antiallergic", False, False, True, True, "10 days"),
        ("Montek-LC", "Montelukast + Levocetirizine", "10mg+5mg", "Tablet", "Antiallergic", False, False, True, True, "10 days"),
        ("Monticope", "Montelukast + Levocetirizine", "10mg+5mg", "Tablet", "Antiallergic", False, False, True, True, "10 days"),
        ("Telekast-L", "Montelukast + Levocetirizine", "10mg+5mg", "Tablet", "Antiallergic", False, False, True, True, "10 days"),
        ("Ascoril-D", "Dextromethorphan + Phenylephrine + Chlorpheniramine", "10mg+5mg+2mg/5ml", "Syrup", "Cough", True, True, True, True, "5 days"),
        ("Ascoril LS", "Levosalbutamol + Ambroxol + Guaiphenesin", "1mg+30mg+50mg/5ml", "Syrup", "Cough", True, True, True, True, "5 days"),
        ("Alex Syrup", "Dextromethorphan + Chlorpheniramine + Phenylephrine", "10mg+2mg+5mg/5ml", "Syrup", "Cough", True, True, True, True, "5 days"),
        ("Benadryl Cough Syrup", "Diphenhydramine + Ammonium Chloride", "14mg+138mg/5ml", "Syrup", "Cough", True, True, True, True, "5 days"),
        ("Grilinctus Syrup", "Dextromethorphan + Chlorpheniramine + Guaifenesin", "5ml", "Syrup", "Cough", True, True, True, True, "5 days"),
        ("Cofsil Syrup", "Diphenhydramine + Ammonium Chloride", "10ml", "Syrup", "Cough", True, True, True, True, "5 days"),
        ("Mucolite 30", "Ambroxol", "30mg", "Tablet", "Mucolytic", True, True, True, True, "5 days"),

        # Analgesics, NSAIDs & Muscle Relaxants
        ("Dolo 500", "Paracetamol", "500mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Dolo 650", "Paracetamol", "650mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Calpol 500", "Paracetamol", "500mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Calpol 650", "Paracetamol", "650mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Crocin 500", "Paracetamol", "500mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Crocin 650", "Paracetamol", "650mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Pacimol 650", "Paracetamol", "650mg", "Tablet", "Analgesic", True, True, True, True, "3 days"),
        ("Combiflam", "Ibuprofen + Paracetamol", "400mg+325mg", "Tablet", "Analgesic", True, False, True, True, "3 days"),
        ("Ibugesic Plus", "Ibuprofen + Paracetamol", "400mg+325mg", "Tablet", "Analgesic", True, False, True, True, "3 days"),
        ("Flexon", "Ibuprofen + Paracetamol", "400mg+325mg", "Tablet", "Analgesic", True, False, True, True, "3 days"),
        ("Brufen 400", "Ibuprofen", "400mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Voveran 50", "Diclofenac Sodium", "50mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Voveran SR 100", "Diclofenac Sodium", "100mg", "Tablet", "NSAID", False, False, True, True, "5 days"),
        ("Diclomol", "Diclofenac + Paracetamol", "50mg+325mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Diclomol 200", "Diclofenac + Paracetamol", "200mg", "Tablet", "NSAID", True, False, False, True, "2 days"),
        ("Zerodol", "Aceclofenac", "100mg", "Tablet", "NSAID", True, False, True, True, "5 days"),
        ("Zerodol-P", "Aceclofenac + Paracetamol", "100mg+325mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Zerodol-SP", "Aceclofenac + Paracetamol + Serratiopeptidase", "100mg+325mg+15mg", "Tablet", "NSAID/Anti-inflammatory", True, False, True, True, "5 days"),
        ("Zerodol-TH 4", "Aceclofenac + Thiocolchicoside", "100mg+4mg", "Tablet", "Muscle Relaxant", True, False, True, True, "5 days"),
        ("Zerodol-TH 8", "Aceclofenac + Thiocolchicoside", "100mg+8mg", "Tablet", "Muscle Relaxant", True, False, True, True, "5 days"),
        ("Aceclo Plus", "Aceclofenac + Paracetamol", "100mg+325mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Hifenac-P", "Aceclofenac + Paracetamol", "100mg+325mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Meftal 500", "Mefenamic Acid", "500mg", "Tablet", "NSAID", True, False, True, True, "3 days"),
        ("Meftal-Spas", "Mefenamic Acid + Dicyclomine", "250mg+10mg", "Tablet", "Antispasmodic", True, True, True, True, "3 days"),
        ("Cyclopam", "Dicyclomine + Paracetamol", "20mg+500mg", "Tablet", "Antispasmodic", True, True, True, True, "3 days"),
        ("Baralgan-M", "Paracetamol + Dicyclomine", "500mg+20mg", "Tablet", "Antispasmodic", True, False, True, True, "3 days"),
        ("Buscopan 10", "Hyoscine Butylbromide", "10mg", "Tablet", "Antispasmodic", True, True, True, True, "3 days"),
        ("Drotaverine 40", "Drotaverine", "40mg", "Tablet", "Antispasmodic", True, True, True, True, "3 days"),
        ("Drotin 40", "Drotaverine", "40mg", "Tablet", "Antispasmodic", True, True, True, True, "3 days"),
        ("Drotin-M", "Drotaverine + Mefenamic Acid", "80mg+250mg", "Tablet", "Antispasmodic", True, False, True, True, "3 days"),
        ("Ultracet", "Tramadol + Paracetamol", "37.5mg+325mg", "Tablet", "Analgesic", True, False, True, True, "3 days"),
        ("Tramazac 50", "Tramadol", "50mg", "Capsule", "Analgesic", True, False, True, True, "3 days"),
        ("Myoril 4", "Thiocolchicoside", "4mg", "Capsule", "Muscle Relaxant", True, False, True, True, "5 days"),
        ("Myoril 8", "Thiocolchicoside", "8mg", "Capsule", "Muscle Relaxant", True, False, True, True, "5 days"),
        ("Enzoflam", "Diclofenac + Paracetamol + Serratiopeptidase", "50mg+325mg+15mg", "Tablet", "NSAID", True, False, True, True, "5 days"),

        # Antihistamines & Allergy
        ("Allegra 120", "Fexofenadine", "120mg", "Tablet", "Antihistamine", True, False, False, False, "10 days"),
        ("Allegra 180", "Fexofenadine", "180mg", "Tablet", "Antihistamine", True, False, False, False, "10 days"),
        ("Fexigra 120", "Fexofenadine", "120mg", "Tablet", "Antihistamine", True, False, False, False, "10 days"),
        ("Fexigra 180", "Fexofenadine", "180mg", "Tablet", "Antihistamine", True, False, False, False, "10 days"),
        ("Cetzine 10", "Cetirizine", "10mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Alerid 10", "Cetirizine", "10mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Okacet 10", "Cetirizine", "10mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Zyrtec 10", "Cetirizine", "10mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Levocet 5", "Levocetirizine", "5mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Xyzal 5", "Levocetirizine", "5mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("1-AL 5", "Levocetirizine", "5mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Atarax 10", "Hydroxyzine", "10mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Atarax 25", "Hydroxyzine", "25mg", "Tablet", "Antihistamine", False, False, True, True, "5 days"),
        ("Bilashine 20", "Bilastine", "20mg", "Tablet", "Antihistamine", True, False, False, False, "10 days"),
        ("Bilaxten 20", "Bilastine", "20mg", "Tablet", "Antihistamine", True, False, False, False, "10 days"),
        ("Cheston Cold", "Cetirizine + Phenylephrine + Paracetamol", "5mg+10mg+325mg", "Tablet", "Cold", True, False, True, True, "3 days"),
        ("Sinarest", "Paracetamol + Phenylephrine + Chlorpheniramine", "500mg+10mg+2mg", "Tablet", "Cold", True, False, True, True, "3 days"),
        ("Wikoryl", "Paracetamol + Phenylephrine + Chlorpheniramine", "500mg+5mg+2mg", "Tablet", "Cold", True, False, True, True, "3 days"),
        ("Maxtra Syrup", "Phenylephrine + Chlorpheniramine", "5mg+2mg/5ml", "Syrup", "Cold", True, False, True, True, "3 days"),
        ("Nasivion Adult Nasal Spray", "Oxymetazoline", "0.05%", "Nasal Spray", "Decongestant", True, False, True, True, "3 days"),
        ("Otrivin Adult Nasal Drops", "Xylometazoline", "0.1%", "Nasal Drops", "Decongestant", True, False, True, True, "3 days"),

        # Vitamins, Minerals & Hematinics
        ("Becosules", "Vitamin B-Complex + Vitamin C", "Standard", "Capsule", "Vitamin", True, False, False, True, "30 days"),
        ("Becosules Z", "Vitamin B-Complex + Vitamin C + Zinc", "Standard", "Capsule", "Vitamin", True, False, False, True, "30 days"),
        ("Neurobion Forte", "Vitamin B1 + B6 + B12", "Standard", "Tablet", "Vitamin", True, False, False, True, "30 days"),
        ("Neurobion Plus", "Mecobalamin + Pyridoxine + Nicotinamide", "Standard", "Tablet", "Vitamin", True, False, False, True, "30 days"),
        ("Nurokind-LC", "Levocarnitine + Mecobalamin + Folic Acid", "Standard", "Tablet", "Nutritional", True, False, False, True, "30 days"),
        ("Shelcal 500", "Calcium Carbonate + Vitamin D3", "500mg+250IU", "Tablet", "Calcium", True, False, False, True, "60 days"),
        ("Shelcal HD", "Calcium Carbonate + Vitamin D3", "500mg+500IU", "Tablet", "Calcium", True, False, False, True, "60 days"),
        ("Gemcal", "Calcium Carbonate + Calcitriol + Zinc", "500mg+0.25mcg+7.5mg", "Capsule", "Calcium", True, False, False, True, "60 days"),
        ("Cipcal 500", "Calcium + Vitamin D3", "500mg+250IU", "Tablet", "Calcium", True, False, False, True, "60 days"),
        ("Supracal", "Calcium Citrate + Vitamin D3", "500mg+200IU", "Tablet", "Calcium", True, False, False, True, "60 days"),
        ("D-Rise 60K", "Cholecalciferol (Vitamin D3)", "60000 IU", "Capsule", "Vitamin D", False, False, False, True, "8 weeks (Once weekly)"),
        ("Calcirol Sachet", "Cholecalciferol (Vitamin D3)", "60000 IU", "Sachet", "Vitamin D", False, False, False, True, "8 weeks (Once weekly)"),
        ("Uprise-D3 60K", "Cholecalciferol (Vitamin D3)", "60000 IU", "Capsule", "Vitamin D", False, False, False, True, "8 weeks (Once weekly)"),
        ("Tayal 60K", "Cholecalciferol (Vitamin D3)", "60000 IU", "Drops", "Vitamin D", False, False, False, True, "8 weeks (Once weekly)"),
        ("Orofer-XT", "Ferrous Ascorbate + Folic Acid", "100mg+1.5mg", "Tablet", "Iron", True, False, False, True, "60 days"),
        ("Autrin", "Ferrous Fumarate + Folic Acid + B12", "150mg+1.5mg", "Capsule", "Iron", True, False, False, True, "60 days"),
        ("Livogen Z", "Ferrous Fumarate + Folic Acid + Zinc", "150mg+0.5mg+50mg", "Tablet", "Iron", True, False, False, True, "60 days"),
        ("Fefol-Z", "Ferrous Spansule + Folic Acid + Zinc", "150mg+0.5mg+61.8mg", "Capsule", "Iron", True, False, False, True, "60 days"),
        ("Zincovit", "Multivitamin + Multimineral with Zinc", "Standard", "Tablet", "Multivitamin", True, False, False, True, "30 days"),
        ("Supradyn Daily", "Multivitamin with Minerals + Trace Elements", "Standard", "Tablet", "Multivitamin", True, False, False, True, "30 days"),
        ("Evion 400", "Tocopheryl Acetate (Vitamin E)", "400mg", "Capsule", "Vitamin", True, False, False, True, "30 days"),
        ("Limcee 500", "Vitamin C (Ascorbic Acid)", "500mg", "Chewable Tablet", "Vitamin", True, False, False, True, "30 days"),
        ("Celin 500", "Vitamin C", "500mg", "Tablet", "Vitamin", True, False, False, True, "30 days"),

        # Neuropsychiatry & Sedatives
        ("Nexito 5", "Escitalopram", "5mg", "Tablet", "Antidepressant", False, False, True, True, "30 days"),
        ("Nexito 10", "Escitalopram", "10mg", "Tablet", "Antidepressant", False, False, True, True, "30 days"),
        ("Nexito Plus", "Escitalopram + Clonazepam", "5mg+0.5mg", "Tablet", "Antidepressant/Anxiolytic", False, False, True, True, "30 days"),
        ("Clonafit 0.25", "Clonazepam", "0.25mg", "Tablet", "Anxiolytic", False, False, True, True, "14 days"),
        ("Clonafit 0.5", "Clonazepam", "0.5mg", "Tablet", "Anxiolytic", False, False, True, True, "14 days"),
        ("Zapiz 0.25", "Clonazepam", "0.25mg", "Tablet", "Anxiolytic", False, False, True, True, "14 days"),
        ("Zapiz 0.5", "Clonazepam", "0.5mg", "Tablet", "Anxiolytic", False, False, True, True, "14 days"),
        ("Restyl 0.25", "Alprazolam", "0.25mg", "Tablet", "Anxiolytic", False, False, True, True, "7 days"),
        ("Restyl 0.5", "Alprazolam", "0.5mg", "Tablet", "Anxiolytic", False, False, True, True, "7 days"),
        ("Alprax 0.25", "Alprazolam", "0.25mg", "Tablet", "Anxiolytic", False, False, True, True, "7 days"),
        ("Alprax 0.5", "Alprazolam", "0.5mg", "Tablet", "Anxiolytic", False, False, True, True, "7 days"),
        ("Ativan 1", "Lorazepam", "1mg", "Tablet", "Anxiolytic", False, False, True, True, "7 days"),
        ("Ativan 2", "Lorazepam", "2mg", "Tablet", "Anxiolytic", False, False, True, True, "7 days"),

        # Topicals & Dermatologicals
        ("Betadine Ointment 5%", "Povidone Iodine", "5%", "Ointment", "Antiseptic", True, False, True, False, "7 days"),
        ("Betadine Gargle 2%", "Povidone Iodine", "2%", "Gargle", "Antiseptic", True, False, True, False, "5 days"),
        ("Soframycin Cream", "Framycetin", "1%", "Cream", "Antiseptic", True, False, True, False, "7 days"),
        ("T-Bact Ointment", "Mupirocin", "2%", "Ointment", "Antibiotic Topical", True, False, True, False, "7 days"),
        ("Bactroban Ointment", "Mupirocin", "2%", "Ointment", "Antibiotic Topical", True, False, True, False, "7 days"),
        ("Candid Cream", "Clotrimazole", "1%", "Cream", "Antifungal Topical", True, False, True, False, "14 days"),
        ("Candid-B Cream", "Clotrimazole + Beclomethasone", "1%+0.025%", "Cream", "Antifungal/Steroid", True, False, True, False, "7 days"),
        ("Quadriderm RF", "Beclomethasone + Clotrimazole + Neomycin", "Standard", "Cream", "Triple Action Topical", True, False, True, False, "7 days"),
        ("Tenovate Cream", "Clobetasol Propionate", "0.05%", "Cream", "Corticosteroid Topical", True, False, False, False, "7 days"),
        ("Panderm Plus", "Clobetasol + Ofloxacin + Ornidazole + Terbinafine", "Standard", "Cream", "Combination Topical", True, False, True, False, "7 days"),
        ("Kenacort 0.1% Oral Paste", "Triamcinolone Acetonide", "0.1%", "Paste", "Oral Paste", True, False, True, False, "5 days"),
    ]

    for bname, gname, strength, form, cat, morn, aft, night, after_food, dur in ADDITIONAL_INDIAN_FORMULATIONS:
        atc_code, atc_cat = get_atc_info(gname)
        entry = {
            "brand_name": bname.strip(),
            "generic_name": gname.strip(),
            "strength": strength.strip(),
            "form": form.strip(),
            "category": cat.strip(),
            "morning": morn,
            "afternoon": aft,
            "night": night,
            "after_food": after_food,
            "duration": dur.strip(),
            "atc_code": atc_code,
            "atc_category": atc_cat,
        }
        merged_catalog[bname.strip().lower()] = entry

    # Convert to sorted list by brand_name
    final_list = sorted(list(merged_catalog.values()), key=lambda x: x["brand_name"].lower())

    # Write out
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(final_list, f, indent=2, ensure_ascii=False)

    print(f"\n Successfully generated Master Indian Drug Catalog with {len(final_list)} entries at:")
    print(f"-> {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    main()
