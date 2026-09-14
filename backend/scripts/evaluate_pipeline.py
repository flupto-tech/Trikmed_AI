import asyncio
import os
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Mock the LLM to return exactly what an LLM would extract using the updated prompt,
# so we can test the rest of the backend extraction & validation pipeline.
from app.api.routes.ai import MedicineItemSchema
import app.api.routes.ai
import app.ai.adapter

class PerfectMockLLM:
    def complete(self, system: str, user: str, schema):
        from app.api.routes.ai import StructuredPrescriptionSchema
        res = StructuredPrescriptionSchema()
        t_lower = user.lower()
        
        meds = []
        if "dolo 650" in t_lower:
            freq = "1-0-1" if ("twice daily" in t_lower or "subah shaam" in t_lower) else ("SOS" if "zarurat pade" in t_lower else None)
            dur = "5 days" if "five days" in t_lower else ("3 days" if "3 din tak" in t_lower else None)
            af = True if ("after food" in t_lower or "khane ke baad" in t_lower) else None
            m = MedicineItemSchema(spoken_name="Dolo 650", frequency=freq, duration=dur, after_food=af)
            if freq == "1-0-1":
                m.morning = True; m.night = True; m.afternoon = False
            meds.append(m)
            
        if "augmentin 625" in t_lower:
            freq = "1-0-1" if "morning and night" in t_lower or "din mein do baar" in t_lower else None
            dur = "5 days" if "five days" in t_lower else None
            af = True if "after food" in t_lower else None
            m = MedicineItemSchema(spoken_name="Augmentin 625", frequency=freq, duration=dur, after_food=af)
            if freq == "1-0-1":
                m.morning = True; m.night = True; m.afternoon = False
            meds.append(m)
            
        if "crocin sos" in t_lower:
            meds.append(MedicineItemSchema(spoken_name="Crocin", frequency="SOS"))
            
        if "azithromycin 500" in t_lower:
            freq = "1-0-0" if "once daily" in t_lower else None
            dur = "3 days" if "three days" in t_lower else None
            m = MedicineItemSchema(spoken_name="Azithromycin 500", frequency=freq, duration=dur)
            if freq == "1-0-0":
                m.morning = True; m.night = False; m.afternoon = False
            meds.append(m)
            
        if "pan 40" in t_lower or "pantoprazole 40" in t_lower:
            name = "Pan 40" if "pan 40" in t_lower else "Pantoprazole 40"
            bf = True if "breakfast se pehle" in t_lower else None
            m = MedicineItemSchema(spoken_name=name, before_food=bf)
            meds.append(m)
            
        res.medicines = meds
        
        labs = []
        if "cbc" in t_lower: labs.append({"spoken_name": "CBC"})
        if "crp" in t_lower: labs.append({"spoken_name": "CRP"})
        if "lipid profile" in t_lower: labs.append({"spoken_name": "Lipid profile"})
        if "fasting sugar" in t_lower or "fasting blood sugar" in t_lower: labs.append({"spoken_name": "Fasting blood sugar"})
        if "hba1c" in t_lower: labs.append({"spoken_name": "HbA1c"})
        if "lft" in t_lower: labs.append({"spoken_name": "LFT"})
        if "kft" in t_lower: labs.append({"spoken_name": "KFT"})
        res.investigations = labs
        
        return res

app.api.routes.ai.get_llm_client = lambda: PerfectMockLLM()
app.ai.adapter.get_llm_client = lambda: PerfectMockLLM()

from app.api.routes.ai import structure_prescription, StructureRequest
tests = [
    {
        "name": "TEST 1",
        "input": "Patient has fever for three days. Dolo 650 twice daily after food for five days.",
        "expect_meds": 1,
        "expect_labs": 0,
    },
    {
        "name": "TEST 2",
        "input": "Augmentin 625 morning and night after food for five days and Crocin SOS.",
        "expect_meds": 2,
        "expect_labs": 0,
    },
    {
        "name": "TEST 3",
        "input": "Patient ko fever hai, Dolo 650 subah shaam khane ke baad, CBC aur fasting sugar kara lena.",
        "expect_meds": 1,
        "expect_labs": 2,
    },
    {
        "name": "TEST 4",
        "input": "Azithromycin 500 once daily for three days, CBC, CRP and lipid profile.",
        "expect_meds": 1,
        "expect_labs": 3,
    },
    {
        "name": "TEST 5",
        "input": "Pan 40 breakfast se pehle aur Dolo 650 zarurat pade to.",
        "expect_meds": 2,
        "expect_labs": 0,
    },
    {
        "name": "TEST 6",
        "input": "Dolo 650, Augmentin 625, Pantoprazole 40, Azithromycin 500.",
        "expect_meds": 4,
        "expect_labs": 0,
    },
    {
        "name": "TEST 7",
        "input": "CBC, HbA1c, fasting blood sugar, lipid profile, LFT and KFT karwa lena.",
        "expect_meds": 0,
        "expect_labs": 6,
    },
    {
        "name": "TEST 8",
        "input": "Patient ko kal raat se fever hai. Dolo 650 subah shaam khane ke baad dena 3 din tak. Aur Augmentin 625 din mein do baar le lena. Sath me CBC, CRP aur LFT check karwa lo. Agar pain ho to Crocin SOS.",
        "expect_meds": 3,
        "expect_labs": 3,
    }
]

def run_tests():
    passed = 0
    for idx, t in enumerate(tests):
        print(f"\n--- {t['name']} ---")
        print(f"Input: {t['input']}")
        
        req = StructureRequest(transcript=t['input'])
        res = structure_prescription(req)
        
        meds = res.get("medicines", [])
        labs = res.get("investigations", [])
        
        print(f"Extracted Meds: {len(meds)}")
        for m in meds:
            print(f"  - {m}")
        print(f"Extracted Labs: {len(labs)}")
        for l in labs:
            print(f"  - {l}")
            
        success = True
        if len(meds) != t['expect_meds']:
            print(f"[FAIL] FAILED: Expected {t['expect_meds']} meds, got {len(meds)}")
            success = False
        if len(labs) != t['expect_labs']:
            print(f"[FAIL] FAILED: Expected {t['expect_labs']} labs, got {len(labs)}")
            success = False
            
        if success:
            print("[PASS] PASSED")
            passed += 1

    print(f"\n============================")
    print(f"Total Tests: {len(tests)}")
    print(f"Passed: {passed}")
    print(f"Failed: {len(tests) - passed}")
    print(f"============================")

if __name__ == '__main__':
    run_tests()




