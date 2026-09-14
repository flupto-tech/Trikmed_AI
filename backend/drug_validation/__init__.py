"""TrikMed Drug & Lab Test Validation Package.
Adheres to Section 5.5 of Technical Specification.
"""

from drug_validation.schema import (
    DrugReferenceSchema,
    ValidationResult,
    LabTestReferenceSchema,
    LabTestValidationResult,
    DoctorCorrectionSchema,
)
from drug_validation.matcher import (
    DrugMatcher,
    LabTestMatcher,
    drug_matcher,
    lab_test_matcher,
)
from drug_validation.supabase_client import (
    SupabaseDrugClient,
    supabase_drug_client,
)

__all__ = [
    "DrugReferenceSchema",
    "ValidationResult",
    "LabTestReferenceSchema",
    "LabTestValidationResult",
    "DoctorCorrectionSchema",
    "DrugMatcher",
    "LabTestMatcher",
    "drug_matcher",
    "lab_test_matcher",
    "SupabaseDrugClient",
    "supabase_drug_client",
]
