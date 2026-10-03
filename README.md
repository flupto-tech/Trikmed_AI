# TrikMed 

**AI-powered clinic management for Tier 2–3 India**

TrikMed is a full-stack clinic management platform built for small and mid-size clinics in non-metro India. Doctors book appointments via WhatsApp, patients get reminders without apps, receptionists manage queues on a mobile-first dashboard, and an internal operations team tracks clinic onboarding, field sales, HR, and company revenue — all from one unified system.

The product ships as a white-label web app, with WhatsApp as the primary interaction channel for patients.

---

## Table of Contents

- [What This Project Is](#what-this-project-is)
- [Features by Role](#features-by-role)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Key Files Reference](#key-files-reference)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Role Access Summary](#role-access-summary)
- [Data Storage Modes](#data-storage-modes)
- [Contributing](#contributing)

---

## What This Project Is

TrikMed is two things in one repo:

1. **Clinic Dashboard** — A web app used by clinic staff (doctors, receptionists) to manage their daily workflow: appointments, patient queue, prescriptions, WhatsApp messages, missed calls, and staff.

2. **Internal Operations Portal** — A separate dashboard for TrikMed's own operations team (Super Admin, Zone Managers, City Managers, MR/Sales, HR, Installers) to manage clinic onboarding, field sales pipeline, HR, and company-wide revenue.

Both share a single Next.js frontend and a single FastAPI backend.

---

## Features by Role

### Clinic Staff

| Role | Access |
|---|---|
| **Doctor / Owner** | Full access to all clinic features, settings, staff management, and revenue data |
| **Receptionist** | Appointments, queue management, walk-ins, WhatsApp chats, patient lookup |
| **Staff** | Custom permission sets created by the owner — granular per-feature access |

Clinic-level permissions are enforced at both the frontend (route guards via `RoleGuard` / `FeatureGuard`) and backend (JWT `clinic_role` + `custom_permissions` payload check). Every action — adding appointments, viewing patient phone numbers, exporting data, sending WhatsApp messages — can be independently granted or revoked per staff member.

### Internal Operations Portal

| Role | Scope |
|---|---|
| **Super Admin** | Company-wide dashboard, all zones, all clinics, all revenue data, HR module, team management |
| **Zone Manager** | Multi-city oversight within their zone — performance KPIs, city comparison, MR drill-down |
| **City Manager** | Single-city operations — clinic pipeline, MR performance, onboarding queue |
| **MR / Sales** | Field pipeline CRM — add clinics, track pitch-to-close stages, view schedule, log visits, see commission |
| **HR Manager** | Employee records, attendance logs, payroll processing, performance scores |
| **Installer** | Clinic setup role — assigned to new clinic onboardings post-sales |

Hierarchy: Super Admin → Zone Manager → City Manager → MR/Sales → Clinic

---

## Tech Stack

### Frontend

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion 12 |
| Charts | Recharts |
| Icons | Lucide React |
| Maps | Leaflet |
| PDF | jsPDF |
| QR Code | qrcode |
| Routing | React Router DOM v7 (within screens) |
| HTTP Client | Native `fetch` via `src/services/api.js` |

### Backend

| Layer | Choice |
|---|---|
| API Server | FastAPI 0.136 (Python) |
| ASGI Server | Uvicorn |
| Schema Validation | Pydantic v2 |
| Auth | Custom HMAC-SHA256 JWT (no third-party JWT library) |
| Password Hashing | PBKDF2-SHA256 (120,000 iterations) |
| Storage (dev) | JSON flat files in `backend/data/` |
| Storage (prod) | Supabase (PostgreSQL) — swap via `TRIKMED_STORAGE=supabase` |
| Migrations | Manual Python migration scripts in `backend/migrations/versions/` |

---

## Folder Structure

```
TRIKMED.WEB/
│
├── frontend/                        # Next.js web application
│   ├── app/                         # Next.js App Router — one folder = one route
│   │   ├── layout.jsx               # Root HTML shell (fonts, global CSS)
│   │   ├── page.jsx                 # Landing page (redirects to /login)
│   │   ├── error.jsx                # App-level error boundary
│   │   ├── not-found.jsx            # 404 page
│   │   ├── login/
│   │   │   ├── page.jsx             # Login selector (clinic vs admin)
│   │   │   ├── clinic/page.jsx      # Clinic email+password login
│   │   │   └── admin/page.jsx       # Portal admin login
│   │   ├── signup/page.jsx          # New clinic self-registration
│   │   ├── lobby/page.jsx           # Public queue display screen (TV/tablet)
│   │   ├── book/[clinicId]/page.jsx # Retired clinic-id booking route
│   │   ├── admin/page.jsx           # Legacy admin redirect
│   │   ├── dashboard/               # Clinic staff dashboard
│   │   │   ├── layout.jsx           # Dashboard shell (sidebar + nav)
│   │   │   ├── page.jsx             # Dashboard home / stats
│   │   │   ├── appointments/page.jsx
│   │   │   ├── queue/page.jsx       # Live patient queue
│   │   │   ├── patients/page.jsx
│   │   │   ├── prescriptions/page.jsx
│   │   │   ├── whatsapp/page.jsx
│   │   │   ├── reminders/page.jsx
│   │   │   ├── missed-calls/page.jsx
│   │   │   ├── qr/page.jsx          # Clinic QR code generator
│   │   │   ├── staff/page.jsx
│   │   │   ├── settings/page.jsx
│   │   │   └── revenue-reports/page.jsx
│   │   ├── mr-manager/              # MR Manager (clinic-side)
│   │   │   ├── layout.jsx
│   │   │   └── page.jsx
│   │   └── portal/                  # Internal ops portal
│   │       ├── layout.jsx           # Portal shell
│   │       ├── page.jsx             # Portal home (role-based redirect)
│   │       ├── super/page.jsx       # Super Admin dashboard
│   │       ├── zone/page.jsx        # Zone Manager dashboard
│   │       ├── zones/page.jsx       # Zones list
│   │       ├── city/page.jsx        # City Manager dashboard
│   │       ├── mr/page.jsx          # MR/Sales dashboard
│   │       ├── sales/page.jsx       # Sales person dashboard
│   │       ├── hr/page.jsx          # HR module
│   │       ├── installer/page.jsx   # Installer dashboard
│   │       ├── commission/page.jsx  # Commission tracker
│   │       ├── onboarding/page.jsx  # Clinic onboarding queue
│   │       ├── clinics/
│   │       │   ├── page.jsx         # All clinics list
│   │       │   └── [id]/page.jsx    # Single clinic detail
│   │       ├── team/page.jsx        # Team management
│   │       ├── add-clinic/page.jsx  # Onboarding wizard
│   │       ├── demo-requests/page.jsx
│   │       ├── reports-pending/page.jsx
│   │       ├── settings/clinic/page.jsx
│   │       └── rx/
│   │           ├── new/page.jsx     # Create new prescription
│   │           ├── history/page.jsx # Prescription history
│   │           └── [id]/page.jsx    # View / print single Rx
│   │
│   ├── src/                         # All shared source code
│   │   ├── screens/                 # Screen-level React components (one per route)
│   │   │   ├── Home.jsx             # Landing page marketing content
│   │   │   ├── Login.jsx            # Login selector screen
│   │   │   ├── LoginClinic.jsx      # Clinic login form
│   │   │   ├── LoginAdmin.jsx       # Admin portal login form
│   │   │   ├── LoginSelect.jsx      # Role picker for demo/staff login
│   │   │   ├── DemoLogin.jsx        # Dev shortcut login
│   │   │   ├── Signup.jsx           # Clinic signup form
│   │   │   ├── AdminDashboard.jsx   # Legacy admin screen
│   │   │   ├── Dashboard.jsx        # Dashboard root
│   │   │   ├── LobbyDisplay.jsx     # Waiting room queue TV screen
│   │   │   ├── BookingPage.jsx      # Legacy booking form (not mounted)
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardHome.jsx      # Stats, MR queue card, session controls
│   │   │   │   ├── Appointments.jsx       # Appointment calendar + list
│   │   │   │   ├── QueueScreen.jsx        # Live token queue management
│   │   │   │   ├── Patients.jsx           # Patient directory + search
│   │   │   │   ├── Prescriptions.jsx      # Prescription history list
│   │   │   │   ├── WhatsAppChats.jsx      # WhatsApp inbox + AI replies
│   │   │   │   ├── Reminders.jsx          # Appointment reminders + broadcasts
│   │   │   │   ├── MissedCalls.jsx        # Missed call log
│   │   │   │   ├── QRCode.jsx             # Clinic QR code + booking link
│   │   │   │   ├── StaffManagement.jsx    # Staff list + permissions editor
│   │   │   │   ├── Settings.jsx           # Clinic settings
│   │   │   │   └── RevenueReports.jsx     # Revenue charts (owner-only)
│   │   │   ├── mr-manager/
│   │   │   │   └── MRManagerPage.jsx      # MR registration + schedule + visits
│   │   │   └── portal/
│   │   │       ├── SuperAdminDash.jsx
│   │   │       ├── ZoneManagerDash.jsx
│   │   │       ├── CityManagerDash.jsx
│   │   │       ├── MRDash.jsx
│   │   │       ├── SalesPersonDash.jsx
│   │   │       ├── HRModule.jsx
│   │   │       ├── InstallerDash.jsx
│   │   │       ├── PortalOverview.jsx
│   │   │       ├── OnboardingQueue.jsx
│   │   │       ├── ClinicsList.jsx
│   │   │       ├── ClinicDetail.jsx
│   │   │       ├── TeamManagement.jsx
│   │   │       ├── AddClinic.jsx
│   │   │       ├── Commission.jsx
│   │   │       ├── DemoRequestsList.jsx
│   │   │       ├── ReportsPending.jsx
│   │   │       └── rx/
│   │   │           ├── NewRx.jsx          # Prescription creation (main editor)
│   │   │           ├── RxView.jsx         # Prescription viewer + print layout
│   │   │           ├── RxHistory.jsx      # All past prescriptions
│   │   │           └── ReviewConsult.jsx  # Consultation review
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Navbar.jsx           # Marketing site navbar
│   │   │   ├── Hero.jsx             # Landing hero section
│   │   │   ├── Features.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── Pricing.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── Stats.jsx
│   │   │   ├── Problem.jsx
│   │   │   ├── CTA.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Toast.jsx            # Toast notification component
│   │   │   ├── TrikMedLogo.jsx      # SVG logo component
│   │   │   ├── WhatsAppButton.jsx   # Floating WhatsApp CTA
│   │   │   ├── clinic/
│   │   │   │   ├── DoctorProfile.jsx
│   │   │   │   └── AddClinicWizard.jsx
│   │   │   ├── dashboard/
│   │   │   │   └── MRQueueCard.jsx  # MR appointment card on dashboard home
│   │   │   ├── mr/
│   │   │   │   ├── MRList.jsx
│   │   │   │   ├── AddMRDialog.jsx
│   │   │   │   ├── MRTodayQueue.jsx
│   │   │   │   └── MRUpcoming.jsx
│   │   │   ├── portal/
│   │   │   │   └── DrillDownView.jsx  # Zone→City→MR drill-down panel
│   │   │   ├── rx/
│   │   │   │   ├── MedicineSearch.jsx
│   │   │   │   ├── VitalsSection.jsx
│   │   │   │   └── AiSuggestionsPanel.jsx
│   │   │   └── ui/
│   │   │       ├── Button.jsx         # Design-system button (primary/secondary)
│   │   │       ├── LoadingSpinner.jsx
│   │   │       ├── RoleGuard.jsx      # Hides children for unauthorized roles
│   │   │       ├── FeatureGuard.jsx   # Hides children for missing permissions
│   │   │       ├── ErrorBanner.jsx
│   │   │       └── Toast.jsx
│   │   │
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.jsx    # Clinic dashboard sidebar + top nav
│   │   │   └── AdminPortalLayout.jsx  # Portal sidebar + top nav
│   │   │
│   │   ├── services/                  # API call modules (one file per domain)
│   │   │   ├── api.js                 # Base fetch client (token + BASE_URL)
│   │   │   ├── authApi.js             # login, logout, me, signup
│   │   │   ├── dashboardApi.js        # stats, session start/end
│   │   │   ├── clinicApi.js           # clinic profile CRUD
│   │   │   ├── patientsApi.js         # patient list, detail, history
│   │   │   ├── staffApi.js            # staff CRUD + permissions
│   │   │   ├── whatsappApi.js         # conversations, messages, broadcasts
│   │   │   ├── prescriptionsApi.js    # Rx CRUD, PDF
│   │   │   ├── remindersApi.js        # reminders + broadcasts
│   │   │   ├── missedCallsApi.js      # missed call log
│   │   │   └── portalApi.js           # portal overview, clinics, onboarding, HR, MR
│   │   │
│   │   ├── config/
│   │   │   └── roles.js               # CLINIC_ROLES, PORTAL_ROLES, PERMISSIONS, nav feature map
│   │   │
│   │   ├── store/
│   │   │   └── portalStore.js         # Lightweight in-memory portal state
│   │   │
│   │   ├── utils/
│   │   │   ├── auth.js                # getUser(), getToken(), logout() helpers
│   │   │   ├── navigation.jsx         # Role-based redirect logic
│   │   │   ├── clinicId.js            # Get clinic ID from JWT / localStorage
│   │   │   ├── phone.js               # Phone number normalizer
│   │   │   ├── queueData.js           # Queue status helpers
│   │   │   └── storage.js             # localStorage wrapper (SSR-safe)
│   │   │
│   │   ├── data/
│   │   │   ├── mockData.js            # Seed data for local dev / demo
│   │   │   └── portalData.js          # Portal mock KPIs / charts
│   │   │
│   │   └── index.css                  # Global CSS + Tailwind base styles
│   │
│   ├── lib/                           # Client-side utility libraries
│   │   (rxStorage, cabinSettings, aiSuggestions, whatsappMessage — if present)
│   │
│   ├── public/                        # Static assets served at /
│   ├── next.config.js                 # Next.js config (Turbopack, TS ignore, localStorage polyfill)
│   ├── vercel.json                    # Vercel deployment config (region: bom1)
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── backend/                           # FastAPI Python backend
│   ├── main.py                        # All route handlers (single-file app)
│   ├── security.py                    # JWT issue/verify + password hash/verify
│   ├── store.py                       # Storage factory: returns JsonStore or SupabaseStore
│   ├── json_store.py                  # File-based data store (dev default)
│   ├── supabase_store.py              # Supabase PostgreSQL store (production)
│   ├── supabase_schema.sql            # SQL schema to run in Supabase SQL editor
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Backend env template
│   ├── data/                          # JSON flat files (auto-created by JsonStore)
│   │   ├── users.json
│   │   ├── clinics.json
│   │   ├── appointments.json
│   │   ├── patients.json
│   │   ├── payments.json
│   │   ├── activity.json
│   │   ├── mr_info.json
│   │   ├── demo_requests.json
│   │   └── backend_store.json
│   ├── routers/                       # FastAPI APIRouter modules
│   │   ├── mr.py                      # MR CRUD (7 endpoints)
│   │   ├── mr_appointments.py         # MR appointment booking (8 endpoints)
│   │   ├── mr_meeting_hours.py        # Meeting hour config + slot generation
│   │   └── mr_visits.py               # Post-visit logs (4 endpoints)
│   ├── schemas/
│   │   └── mr.py                      # Pydantic v2 schemas for MR module
│   ├── services/
│   │   └── mr_slots.py                # Slot generation engine (with optional Redis caching)
│   ├── migrations/
│   │   └── versions/
│   │       ├── 0001_mr_manager_module.py
│   │       └── 0002_mr_info_columns.py
│   └── venv/                          # Python virtual environment (gitignored)
│
├── docs/
│   └── PHASE_1_COMPLETE.md            # Phase 1 feature completion notes
│
├── .gitignore
├── AGENTS.md                          # AI coding agent guidelines (button system)
├── CLAUDE.md                          # Claude Code guidelines (same as AGENTS.md)
└── API_REFERENCE.md                   # Full REST API documentation
```

---

## Key Files Reference

### Frontend — Critical Files

| File | Purpose |
|---|---|
| `frontend/src/services/api.js` | Base HTTP client — all API calls flow through this. Reads `NEXT_PUBLIC_API_URL` and attaches Bearer token from localStorage. |
| `frontend/src/config/roles.js` | Single source of truth for all role names, permissions flags, and which nav items each role can see. |
| `frontend/src/utils/auth.js` | `getUser()`, `getToken()`, `logout()` — used everywhere to read the logged-in user from localStorage. |
| `frontend/src/utils/storage.js` | SSR-safe localStorage wrapper (returns `null` on server, reads/writes on client). |
| `frontend/src/utils/navigation.jsx` | Role-based redirect — after login, routes the user to the correct dashboard based on their `role` and `clinic_role`. |
| `frontend/src/layouts/DashboardLayout.jsx` | Persistent sidebar + top nav for the clinic dashboard. Handles mobile drawer state. |
| `frontend/src/layouts/AdminPortalLayout.jsx` | Persistent sidebar + top nav for the operations portal. |
| `frontend/src/components/ui/Button.jsx` | Design-system button — implements all button styles (primary, secondary, filter chip). All action buttons must use this. |
| `frontend/src/components/ui/RoleGuard.jsx` | Wrapper component that hides children if the current user's role doesn't match. |
| `frontend/next.config.js` | Turbopack config, Node 22+ `localStorage` polyfill, TypeScript ignore flag. |
| `frontend/vercel.json` | Vercel deployment config: region `bom1` (Mumbai), security headers, build commands. |

### Backend — Critical Files

| File | Purpose |
|---|---|
| `backend/main.py` | All FastAPI route handlers in one file. Contains auth, clinic, appointments, queue, patients, staff, portal, and demo endpoints. |
| `backend/security.py` | Custom HMAC-SHA256 token system (`issue_token`, `verify_token`) and PBKDF2 password hashing. No third-party JWT library. |
| `backend/store.py` | Factory function that reads `TRIKMED_STORAGE` env var and returns either `JsonStore` or `SupabaseStore`. |
| `backend/json_store.py` | File-based store that reads/writes JSON files in `backend/data/`. Used for local dev. Thread-safe with file locks. |
| `backend/supabase_store.py` | Supabase PostgreSQL store for production. Same interface as `JsonStore`. |
| `backend/supabase_schema.sql` | Run this once in the Supabase SQL editor to create all tables. |
| `backend/routers/mr.py` | MR registration, listing, blocking, CRUD for the MR Manager module. |
| `backend/routers/mr_appointments.py` | Slot booking with advisory lock to prevent double-booking. |
| `backend/routers/mr_meeting_hours.py` | Doctor configures available windows per weekday; slot engine generates 20-min slots. |
| `backend/routers/mr_visits.py` | Post-visit logs: products discussed, samples, doctor rating, follow-up scheduling. |
| `backend/schemas/mr.py` | Pydantic v2 request/response models for all MR endpoints. |
| `backend/services/mr_slots.py` | Slot generation engine — optionally caches with Redis (5-min TTL, SCAN-based invalidation). Degrades gracefully if Redis is not available. |

---

## Local Development Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | >= 20.0.0 |
| npm | >= 10 |
| Python | 3.11+ |
| Git | any |

### Step 1 — Clone

```bash
git clone https://github.com/vikas-7568/TRIKMED.WEB.git
cd TRIKMED.WEB
```

### Step 2 — Backend

```bash
# Create and activate virtual environment
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env if needed (default values work for local dev)

# Go back to project root and start the API server
cd ..
python -m uvicorn backend.main:app --reload --port 8000
```

The API will be available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

### Step 3 — Frontend

Open a **second terminal**:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# The default value (http://localhost:8000) works with no changes

# Start dev server
npm run dev
```

The app will be available at **http://localhost:3000**

### Step 4 — First Login

By default the JSON store starts empty. Use the signup page at `/signup` to create your first clinic account, then approve it from the backend admin or use the demo shortcut:

```bash
# Dev shortcut login (bypasses password — only works when TRIKMED_DEV_SHORTCUTS != false)
POST http://localhost:8000/dev/demo-login
{ "user_id": "USR-XXXXXXXX" }
```

---

## Environment Variables

### Frontend — `frontend/.env.local`

```env
# FastAPI backend base URL — no trailing slash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend — `backend/.env`

```env
# JWT signing secret — CHANGE THIS in production
TRIKMED_AUTH_SECRET=dev-only-change-me

# Token TTL in seconds (default: 7 days)
TRIKMED_TOKEN_TTL_SECONDS=604800

# Storage backend: "json" (dev) or "supabase" (production)
TRIKMED_STORAGE=json

# Required only when TRIKMED_STORAGE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
# Legacy fallback only:
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> **Security note:** Never commit `.env` or `.env.local` files. Both are listed in `.gitignore`.

---

## Available Scripts

### Frontend

Run all commands from the `frontend/` directory:

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server with hot reload (port 3000) |
| `npm run build` | Build optimised production bundle |
| `npm run start` | Serve the production build locally |
| `npm run lint` | Run ESLint across the project |

### Backend

Run from the **project root** (not inside `backend/`):

```bash
# Start API server (development)
python -m uvicorn backend.main:app --reload --port 8000

# Start API server (production — no reload, multiple workers)
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4

# Check API is alive
curl http://localhost:8000/health
```

---

## Deployment

### Frontend — Vercel (Recommended)

1. Push the repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Set **Root Directory** to `frontend`.
4. Add environment variables in **Project Settings → Environment Variables**:
   - `NEXT_PUBLIC_API_URL` → your deployed backend URL (e.g. `https://api.trikmed.in`)
5. Click **Deploy**.

Vercel auto-detects Next.js. The `frontend/vercel.json` sets region to `bom1` (Mumbai) and adds security headers automatically.

### Backend — Railway / Render / VPS

#### Option A: Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Set **Root Directory** to `/` (project root, not `backend/`).
3. Set **Start Command**:
   ```
   python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
4. Add environment variables:
   - `TRIKMED_AUTH_SECRET` → a strong random secret
   - `TRIKMED_STORAGE` → `supabase`
   - `SUPABASE_URL` and `SUPABASE_SECRET_KEY` (`SUPABASE_SERVICE_ROLE_KEY` remains supported as a legacy fallback)

#### Option B: Render

1. **New Web Service** → connect repo.
2. **Root Directory**: leave blank (project root).
3. **Build Command**: `pip install -r backend/requirements.txt`
4. **Start Command**: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add the same environment variables as above.

#### Option C: VPS (Ubuntu/Debian)

```bash
# Install Python 3.11+
sudo apt install python3.11 python3.11-venv

# Clone repo
git clone https://github.com/vikas-7568/TRIKMED.WEB.git
cd TRIKMED.WEB

# Create venv and install
python3.11 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Set environment variables (or use a .env file)
export TRIKMED_AUTH_SECRET="your-strong-secret"
export TRIKMED_STORAGE="supabase"
export SUPABASE_URL="..."
export SUPABASE_SECRET_KEY="sb_secret_..."

# Run with gunicorn for production
pip install gunicorn
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Database (Supabase)

For production, use Supabase instead of JSON flat files:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** and run `backend/supabase_schema.sql`.
3. Copy your **Project URL** and a backend-only **Secret Key** (`sb_secret_...`) from **Settings - API Keys**.
4. Set `TRIKMED_STORAGE=supabase`, `SUPABASE_URL`, and `SUPABASE_SECRET_KEY` on your backend host. `SUPABASE_SERVICE_ROLE_KEY` is supported only as a legacy fallback while migrating old projects.

### CORS

For production, update the CORS origins in `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## API Reference

All REST endpoints are documented in **[API_REFERENCE.md](./API_REFERENCE.md)**.

Base URL: `NEXT_PUBLIC_API_URL` (default: `http://localhost:8000`)  
All authenticated endpoints require: `Authorization: Bearer <token>`

Quick overview of endpoint groups:

| Group | Prefix | Notes |
|---|---|---|
| Auth | `/auth/*` | login, signup, logout, me, forgot/reset password |
| Queue | `/queue/*` | today's queue, walk-in registration |
| Appointments | `/appointments` | list, create, update |
| Patients | `/patients` | directory, detail, history |
| Staff | `/staff` | CRUD, permissions, activity log |
| Clinics | `/clinics` | CRUD (self-serve) |
| Portal | `/portal/*` | overview, clinics, onboarding, team, revenue |
| MR Manager | `/mr/*`, `/mr-appointments/*` | MR registration, slots, bookings, visits |
| Public | `/public/*` | clinic list for demo selector (no auth) |
| Dev | `/dev/demo-login` | Dev-only shortcut login |

---

## Role Access Summary

```
Super Admin
  └── Zone Manager (per zone)
        └── City Manager (per city)
              └── MR / Sales (field team)
                    └── Clinic (onboarded via MR)
                          ├── Doctor / Owner
                          ├── Receptionist
                          └── Staff (custom permissions)

HR Manager    — cross-cutting, reports to Super Admin
Installer     — clinic setup, assigned post-onboarding
```

Revenue data is accessible only to Super Admin. Zone and City Managers see percentage-based KPIs — no rupee amounts. Payroll is gated by `see_hr_salaries` permission within the HR module.

---

## Data Storage Modes

TrikMed supports two storage backends, switchable via `TRIKMED_STORAGE`:

### `json` (Default — Local Dev)

Data is stored as JSON files in `backend/data/`:

```
backend/data/
├── users.json          # All user accounts (clinic + portal)
├── clinics.json        # All registered clinics
├── appointments.json   # All appointments
├── patients.json       # Patient records
├── payments.json       # Payment records
├── activity.json       # Staff activity log
├── mr_info.json        # MR registration data
└── demo_requests.json  # Demo request submissions
```

Files are created automatically on first run. All operations are synchronous file reads/writes with basic locking. **Do not use this in production.**

### `supabase` (Production)

Uses the Supabase PostgreSQL REST API through the backend storage adapter. Same interface as `JsonStore` - swap by setting `TRIKMED_STORAGE=supabase`, `SUPABASE_URL`, and a backend-only `SUPABASE_SECRET_KEY`. Run `backend/supabase_schema.sql` once to create the schema.

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Follow the button design system in [AGENTS.md](./AGENTS.md) — all buttons must use inline styles, never Tailwind visual classes.
3. For new API endpoints, add entries to [API_REFERENCE.md](./API_REFERENCE.md).
4. Run `npm run lint` before opening a pull request.
5. Test backend changes against both `json` and `supabase` storage modes if possible.

---

> Built for India's 1.3 million small clinics. WhatsApp-native, mobile-first, works on 4G.
