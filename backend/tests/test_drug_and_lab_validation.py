import pytest
from drug_validation.matcher import drug_matcher, lab_test_matcher
from drug_validation.schema import DrugReferenceSchema, LabTestReferenceSchema
from app.services.drug_validator import drug_validator


def test_drug_matcher_3_bands():
    """Test 3-band scoring in drug matcher."""
    # Green Band (>= 0.85)
    res_green = drug_matcher.match("Dolo 650")
    assert res_green.band == "green"
    assert res_green.score >= 0.85
    assert res_green.auto_corrected is True
    assert "Dolo" in res_green.matched_name

    # Yellow Band via generic fallback (0.75 capped)
    res_yellow = drug_matcher.match("Metformin")
    assert res_yellow.band == "yellow"
    assert res_yellow.score <= 0.84
    assert res_yellow.status == "needs_confirmation"

    # Red Band (< 0.70)
    res_red = drug_matcher.match("SuperUnknownFakeDrugNameX99")
    assert res_red.band == "red"
    assert res_red.score < 0.70
    assert res_red.status == "unverified"


def test_lab_test_matcher_direct_and_aliases():
    """Test lab test catalog matching with exact and Hinglish aliases."""
    # Direct match
    res_cbc = lab_test_matcher.match("CBC")
    assert res_cbc.band == "green"
    assert "CBC" in res_cbc.matched_name
    assert res_cbc.category == "Hematology"
    assert res_cbc.specimen == "EDTA Whole Blood"

    # Hinglish alias: "Sidhi Si" -> CBC
    res_sidhi = lab_test_matcher.match("sidhi si")
    assert res_sidhi.band == "green"
    assert "CBC" in res_sidhi.matched_name

    # Hindi alias: "chhati ka x-ray" -> Chest X-Ray
    res_xray = lab_test_matcher.match("chhati ka x-ray")
    assert res_xray.band == "green"
    assert "Chest X-Ray" in res_xray.matched_name
    assert res_xray.category == "Radiology"

    # Fasting requirement verification
    res_lft = lab_test_matcher.match("Lipid Profile")
    assert res_lft.is_fasting_required is True

    res_hba1c = lab_test_matcher.match("HbA1c")
    assert res_hba1c.is_fasting_required is False


def test_lab_test_text_extraction():
    """Test extraction of multiple diagnostic tests from spoken doctor text."""
    text = "Patient ko fever hai. KFT aur LFT karwana hai, sath mein ultrasound abdomen aur dengue test likh dijiye."
    extracted = lab_test_matcher.extract_from_text(text)
    test_names = [e.matched_name for e in extracted]

    assert any("Kidney Function Test" in n or "KFT" in n for n in test_names)
    assert any("Liver Function Test" in n or "LFT" in n for n in test_names)
    assert any("Ultrasound" in n for n in test_names)
    assert any("Dengue" in n for n in test_names)


def test_drug_validator_service_integration():
    """Test integration of lab tests inside drug_validator service."""
    # Lab test validation
    res = drug_validator.validate_lab_test("Serum Ferritin")
    assert res["band"] == "green"
    assert "Serum Ferritin" in res["matched_name"]
    assert res["category"] == "Hematology"

    # Multi-lab test extraction
    extracted = drug_validator.extract_lab_tests("ECG aur Chest X-ray urgent karwaiye")
    names = [x["matched_name"] for x in extracted]
    assert any("ECG" in n for n in names)
    assert any("Chest X-Ray" in n for n in names)
