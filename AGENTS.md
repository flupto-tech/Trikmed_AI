# TrikMed — AI Agent Coding Guidelines

This file instructs AI coding agents (Codex, Cursor, Copilot, Antigravity, etc.) on how to write code that is consistent with the TrikMed codebase.

---

## Button Design System

All buttons use **inline styles** (not Tailwind classes). The canonical reference is the "End consultation" button in `src/screens/portal/rx/NewRx.jsx`.

### Primary Button
```jsx
style={{
  background:     '#0F2342',   // dark navy — brand primary
  color:          '#fff',
  borderRadius:   '12px',
  padding:        '8px 18px',
  fontWeight:     600,
  fontSize:       '13px',
  border:         'none',
  cursor:         'pointer',
  display:        'inline-flex',
  alignItems:     'center',
  gap:            '8px',
  whiteSpace:     'nowrap',
  flexShrink:     0,
}}
```

### Secondary Button
```jsx
style={{
  background:     '#fff',
  color:          '#0F2342',
  borderRadius:   '12px',
  padding:        '8px 18px',
  fontWeight:     600,
  fontSize:       '13px',
  border:         '1.5px solid #D3D1C7',
  cursor:         'pointer',
  display:        'inline-flex',
  alignItems:     'center',
  gap:            '8px',
  whiteSpace:     'nowrap',
  flexShrink:     0,
}}
```

### Filter Chip — Active
```jsx
style={{
  background:     '#0F2342',
  color:          '#fff',
  borderRadius:   '12px',
  padding:        '6px 14px',
  fontWeight:     600,
  fontSize:       '13px',
  border:         'none',
  cursor:         'pointer',
  display:        'inline-flex',
  alignItems:     'center',
  whiteSpace:     'nowrap',
  fontFamily:     'inherit',
}}
```

### Filter Chip — Inactive
```jsx
style={{
  background:     '#fff',
  color:          '#374151',
  borderRadius:   '12px',
  padding:        '6px 14px',
  fontWeight:     600,
  fontSize:       '13px',
  border:         '1px solid #d1d5db',
  cursor:         'pointer',
  display:        'inline-flex',
  alignItems:     'center',
  whiteSpace:     'nowrap',
  fontFamily:     'inherit',
}}
```

### Button Rules
- `borderRadius` is always `12px` — never `999px`, `50%`, or Tailwind `rounded-full/2xl/3xl`
- Use `<Button>` from `src/components/ui/Button.jsx` for all action buttons — it implements these styles
- Never use Tailwind classes for button visual styling (`bg-slate-900`, `rounded-xl`, etc.)
- Disabled state: add `opacity: 0.5, cursor: 'not-allowed'` to the style
- The `<Button>` component accepts a `className` prop only for layout utilities (`mx-auto`, `flex-shrink-0`, etc.)

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| Brand navy | `#0F2342` | Primary buttons, headings, sidebar background |
| Coral accent | `#E8663D` | Highlights, prescription Rx symbol, alerts |
| Light blue | `#EFF6FF` | Table header backgrounds, subtle fills |
| Border grey | `#D3D1C7` | Secondary button borders, dividers |
| Text grey | `#374151` | Body text, inactive chip labels |
| Background | `#F9FAFB` | Page background, card backgrounds |

---

## API Calls

All API calls go through `src/services/api.js`. Never use raw `fetch` directly in a screen component.

```js
// ✅ Correct
import api from '../services/api'
const data = await api.get('/appointments')
await api.patch(`/appointments/${id}`, { queueStatus: 'completed' })

// ❌ Wrong — raw fetch, no auth token, no base URL
fetch('http://localhost:8000/appointments')
```

Domain-specific API modules live in `src/services/`:
- `authApi.js` — login, logout, me
- `dashboardApi.js` — stats, session
- `patientsApi.js` — patient CRUD
- `staffApi.js` — staff CRUD + permissions
- `portalApi.js` — portal overview, clinics, onboarding, HR

---

## Auth & User Access

Read the current user via `src/utils/auth.js`:

```js
import { getUser, getToken, isLoggedIn } from '../utils/auth'

const user = getUser()          // { id, name, role, clinic_id, clinic_role, custom_permissions }
const token = getToken()        // JWT string
const ok = isLoggedIn()         // boolean
```

Use `<RoleGuard>` and `<FeatureGuard>` (from `src/components/ui/`) to conditionally render:

```jsx
// Only show for owners
<RoleGuard roles={['doctor_owner', 'owner']}>
  <DeleteButton />
</RoleGuard>

// Only show if permission is granted
<FeatureGuard permission="export_data">
  <ExportButton />
</FeatureGuard>
```

---

## localStorage

Always use the SSR-safe wrapper from `src/utils/storage.js`:

```js
import { storage } from '../utils/storage'

storage.set('trikmed_token', token)
const token = storage.get('trikmed_token')
storage.remove('trikmed_token')
```

Never call `localStorage.getItem(...)` directly — it throws on the server during Next.js SSR.

---

## Adding New API Endpoints (Backend)

1. Define request/response models as Pydantic v2 `BaseModel` classes at the top of `main.py` (or in `schemas/` for larger modules).
2. Add the route handler in `main.py` (or a new file in `routers/` for a new module).
3. Use the appropriate dependency: `require_clinic_user`, `require_portal_user`, `require_staff_admin`.
4. Add the endpoint to `API_REFERENCE.md`.

```python
# ✅ Correct — uses dependency injection for auth
@app.get("/my-endpoint")
def my_endpoint(current_user: dict[str, Any] = Depends(require_clinic_user)) -> dict[str, Any]:
    return store.something(current_user["clinic_id"])
```

---

## Adding New Screens (Frontend)

1. Create the screen component in `src/screens/<area>/MyScreen.jsx`.
2. Create the Next.js page in `app/<route>/page.jsx` — it should just import and render the screen:
   ```jsx
   'use client'
   import MyScreen from '../../src/screens/<area>/MyScreen'
   export default function Page() { return <MyScreen /> }
   ```
3. Add the route to the sidebar nav in the appropriate layout (`DashboardLayout.jsx` or `AdminPortalLayout.jsx`).
4. Add the permission/role check in `src/config/roles.js` if the route is role-gated.

---

## File Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `QueueScreen.jsx` |
| API service modules | camelCase | `dashboardApi.js` |
| Utility functions | camelCase | `auth.js`, `storage.js` |
| Python modules | snake_case | `mr_appointments.py` |
| Data JSON files | snake_case | `mr_info.json` |

---

## Do Not

- Do not import Tailwind classes for visual button styling
- Do not call `localStorage` directly — use `storage.js`
- Do not hardcode `http://localhost:8000` in fetch calls — use `api.js`
- Do not use `999px` or `50%` border radius on buttons
- Do not add new routers without registering them in `main.py`
- Do not commit `.env` or `.env.local` files
