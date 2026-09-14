import os
import sys
import random
from datetime import timedelta, date
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.core.config import load_environment
from app.core.security import hash_password
from app.storage.supabase_store import SupabaseStore


def verify_demo_data(store: SupabaseStore, clinic_id: str):
    """Verify relationships and existence of demo data."""
    clinic = store.get_clinic(clinic_id)
    if not clinic:
        print("VERIFY ERROR: Demo clinic not found.")
        return

    users = store.list_clinic_users(clinic_id)
    admin_count = sum(1 for u in users if u.get("clinic_role") == "owner")
    doctor_count = sum(1 for u in users if u.get("clinic_role") in ["doctor", "doctor_owner"])
    staff_count = sum(1 for u in users if u.get("clinic_role") == "staff")
    
    patients = store.list_patients(clinic_id)
    appointments = store.list_appointments(clinic_id)
    
    print("\n========================================")
    print("TRIKMED DEMO DATA READY")
    print("========================================")
    print(f"Clinic:            {clinic.get('clinic_name')}")
    print(f"Clinic Code:       DEMO-CLINIC")
    print(f"Users created:")
    print(f"  Clinic Admins:   {admin_count}")
    print(f"  Doctors:         {doctor_count}")
    print(f"  Staff:           {staff_count}")
    print(f"Patients:          {len(patients)}")
    print(f"Appointments:      {len(appointments)}")
    print("\nDemo credentials are configured through environment variables.")
    print(f"Demo clinic ID:    {clinic_id}")
    print("========================================\n")


def main():
    load_environment()

    if os.getenv("TRIKMED_DEMO_MODE", "").strip().lower() != "true" or \
       os.getenv("BOOTSTRAP_DEMO_DATA", "").strip().lower() != "true":
        print("Demo bootstrap aborted: TRIKMED_DEMO_MODE=true and BOOTSTRAP_DEMO_DATA=true must be set.", file=sys.stderr)
        sys.exit(1)

    admin_password = os.getenv("DEMO_CLINIC_ADMIN_PASSWORD")
    doctor_password = os.getenv("DEMO_DOCTOR_PASSWORD")
    staff_password = os.getenv("DEMO_STAFF_PASSWORD")

    if not admin_password or not doctor_password or not staff_password:
        print("Demo bootstrap aborted: Passwords must be provided via DEMO_CLINIC_ADMIN_PASSWORD, DEMO_DOCTOR_PASSWORD, DEMO_STAFF_PASSWORD.", file=sys.stderr)
        sys.exit(1)

    store = SupabaseStore()

    # 1. Create or Find Clinic
    resolved_clinic_id = store._resolve_clinic_id("DEMO-CLINIC")
    if resolved_clinic_id:
        clinic = store.get_clinic(resolved_clinic_id)
        print(f"Found existing demo clinic: {clinic.get('clinic_name')}")
    else:
        print("Creating demo clinic...")
        clinic = store.add_clinic({
            "clinic_code": "DEMO-CLINIC",
            "clinic_name": "TrikMed Demo Clinic",
            "doctor_name": "Dr. Demo",
            "contact_phone": "+919000000000",
            "email": "demo@trikmed.example",
            "address_line1": "123 Demo Street",
            "city": "Demo City",
            "state": "Kerala",
            "plan": "pro",
            "status": "active",
        })
        resolved_clinic_id = clinic["id"]
        print(f"Created demo clinic with ID: {resolved_clinic_id}")

    # 2. Clinic Admin
    admin_email = os.getenv("DEMO_CLINIC_ADMIN_EMAIL", "clinicadmin@trikmed.example")
    if not store.find_user_by_email(admin_email):
        store.add_user({
            "email": admin_email,
            "name": "Dr. Demo Clinic Admin",
            "role": "clinic",
            "clinic_role": "owner",
            "clinic_id": resolved_clinic_id,
            "phone": "+919000000000",
            "password_hash": hash_password(admin_password),
            "is_active": True,
        })
        print(f"Created clinic admin: {admin_email}")
    else:
        print(f"Clinic admin {admin_email} already exists.")

    # 3. Doctors
    doctors = [
        {"name": "Dr. Aarav Menon", "email": "aarav.demo@trikmed.example", "phone": "+919000000001"},
        {"name": "Dr. Ananya Nair", "email": "ananya.demo@trikmed.example", "phone": "+919000000002"},
        {"name": "Dr. Rohan Thomas", "email": "rohan.demo@trikmed.example", "phone": "+919000000003"},
        {"name": "Dr. Meera Iyer", "email": "meera.demo@trikmed.example", "phone": "+919000000004"},
        {"name": "Dr. Vikram Shah", "email": "vikram.demo@trikmed.example", "phone": "+919000000005"},
    ]
    for doc in doctors:
        if not store.find_user_by_email(doc["email"]):
            store.add_user({
                "email": doc["email"],
                "name": doc["name"],
                "role": "clinic",
                "clinic_role": "doctor",
                "clinic_id": resolved_clinic_id,
                "phone": doc["phone"],
                "password_hash": hash_password(doctor_password),
                "is_active": True,
            })
            print(f"Created doctor: {doc['name']}")
        else:
            print(f"Doctor {doc['name']} already exists.")

    # 4. Staff
    staff = [
        {"name": "Priya Demo", "email": "priya.demo@trikmed.example", "phone": "+919000000010"},
        {"name": "Rahul Demo", "email": "rahul.demo@trikmed.example", "phone": "+919000000011"},
        {"name": "Sneha Demo", "email": "sneha.demo@trikmed.example", "phone": "+919000000012"},
    ]
    for st in staff:
        if not store.find_user_by_email(st["email"]):
            store.add_user({
                "email": st["email"],
                "name": st["name"],
                "role": "clinic",
                "clinic_role": "staff",
                "clinic_id": resolved_clinic_id,
                "phone": st["phone"],
                "password_hash": hash_password(staff_password),
                "is_active": True,
            })
            print(f"Created staff: {st['name']}")
        else:
            print(f"Staff {st['name']} already exists.")

    # 5. Patients
    existing_patients = store.list_patients(resolved_clinic_id)
    if len(existing_patients) < 30:
        print("Creating demo patients...")
        for i in range(1, 31):
            store.add_or_update_patient({
                "clinic_id": resolved_clinic_id,
                "phone": f"+91999000{i:04d}",
                "full_name": f"Demo Patient {i:02d}",
                "age": 20 + i,
                "gender": "male" if i % 2 == 0 else "female",
            })
        print("Created 30 patients.")
    else:
        print("Patients already exist, skipping.")

    # 6. Appointments
    existing_appointments = store.list_appointments(resolved_clinic_id)
    if len(existing_appointments) < 40:
        print("Creating demo appointments...")
        patients = store.list_patients(resolved_clinic_id)
        doctor_rows = store._select("clinic_doctors", {"clinic_id": f"eq.{resolved_clinic_id}", "is_active": "eq.true"})
        doctor_ids = [d["id"] for d in doctor_rows]
        
        if patients and doctor_ids:
            today = date.today()
            random.seed(42)
            for i in range(40):
                p = random.choice(patients)
                d_id = random.choice(doctor_ids)
                day_offset = random.randint(-5, 5)
                appt_date = today + timedelta(days=day_offset)
                
                status = "booked"
                queue_status = "booked"
                if day_offset < 0:
                    status = "completed"
                    queue_status = "completed"
                elif day_offset == 0:
                    status = random.choice(["booked", "checked_in", "in_progress", "completed"])
                    queue_status = status
                    
                store.add_appointment({
                    "clinic_id": resolved_clinic_id,
                    "patient_id": p["id"],
                    "doctor_id": d_id,
                    "date": appt_date.isoformat(),
                    "time": f"{10 + (i % 8):02d}:00:00",
                    "status": status,
                    "queueStatus": queue_status,
                    "visit_type": "new" if i % 3 == 0 else "followup",
                    "reason": "Synthetic demonstration record - not real medical information."
                })
            print("Created 40 appointments.")
    else:
        print("Appointments already exist, skipping.")

    # 7. Verification Summary
    verify_demo_data(store, resolved_clinic_id)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Demo bootstrap failed: {exc}", file=sys.stderr)
        sys.exit(1)
