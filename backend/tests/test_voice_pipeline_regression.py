from app.api.routes import ai


VOICE_TEXT = """patient ko thyroid problem hai aur usko seene mein dard aur chakkar aa rahe hain.
Dava mein betahistein 16 mg din mein do bar khana khane ke bad 7 dinon ke liye lena hai.
livo thyroxine ko uski current dose ke bina doctor ki salah ke bina band nahin karni hai aur subah khali pet pani ke sath lena hai.
thyroxin lene ke kam se kam 30 se 60 minute bad nashta karna hai.
test mein CVC CDM sodium potassium fasting blood glucose TSH aur free T4 karvana hai."""


def test_voice_extraction_preserves_raw_terms_and_never_invents_entities(monkeypatch):
    class Extractor:
        def complete(self, system, user, schema):
            # This represents a compliant extraction response. It deliberately
            # has no invented dose for the continuing thyroid medicine.
            return schema.model_validate({
                "symptoms": ["chest pain", "dizziness"],
                "medicines": [
                    {"spoken_name": "betahistein", "dose": "16 mg", "frequency": "1-0-1", "timing": "after food", "duration": "7 days"},
                    {"spoken_name": "livo thyroxine", "instructions": "continue current dose; do not stop without doctor's advice", "timing": "empty stomach"},
                ],
                "investigations": ["CVC", "CDM", "sodium", "potassium", "fasting blood glucose", "TSH", "free T4"],
                "advice": ["take thyroxin 30 to 60 minutes before breakfast"],
            })

    monkeypatch.setattr(ai, "get_llm_client", lambda: Extractor())
    monkeypatch.setattr(ai.drug_validator, "_semantic_fallback", lambda _: None)
    result = ai.structure_prescription(ai.StructureRequest(transcript=VOICE_TEXT))

    assert result["raw_transcript"] == VOICE_TEXT
    assert {"chest pain", "dizziness"}.issubset(set(result["symptoms"]))
    medicines = {item["spoken_name"]: item for item in result["medicines"]}
    assert medicines["betahistein"]["dose"] == "16 mg"
    assert medicines["livo thyroxine"]["dose"] is None
    assert medicines["livo thyroxine"]["validation_status"] != "verified"
    assert "thyroid extract" not in str(result).lower()
    assert "serum creatinine" not in result["investigations"]
    for spoken_test in ("CVC", "CDM", "sodium", "potassium", "fasting blood glucose", "TSH", "free T4"):
        assert any(spoken_test.casefold() in value.casefold() for value in result["investigations"])


def test_unsupported_llm_medicine_is_dropped_not_sent_to_rag(monkeypatch):
    class InventingExtractor:
        def complete(self, system, user, schema):
            return schema.model_validate({"medicines": [{"spoken_name": "Thyroid Extract", "dose": "16 mg"}]})

    monkeypatch.setattr(ai, "get_llm_client", lambda: InventingExtractor())
    monkeypatch.setattr(ai.drug_validator, "_semantic_fallback", lambda _: None)
    result = ai.structure_prescription(ai.StructureRequest(transcript="livo thyroxine continue current dose"))
    assert result["medicines"] == []
    assert result["extraction_warnings"]
