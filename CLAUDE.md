# TrikMed — Claude Code Guide

## Repo Structure
- `frontend/` — Next.js 16, React 19, Tailwind v4 (Vercel pe deploy)
- `backend/` — FastAPI, Python 3.11, JSON store (Railway pe deploy)

## Frontend Rules
- Sabhi frontend files: `frontend/src/` mein hain
- Deploy: Vercel (auto-deploy on push)
- API calls: `NEXT_PUBLIC_API_URL` env var use karo
- Run locally: `cd frontend && npm run dev`

## Backend Rules  
- Sabhi backend files: `backend/` mein hain
- Deploy: Railway (auto-deploy on push)
- Entry point: `backend/main.py`
- Run locally: `cd backend && uvicorn main:app --reload`
- Imports: KABHI `from backend.xyz` mat likho — sirf `from xyz`

## Golden Rules
1. Frontend change = sirf `frontend/` folder touch karo
2. Backend change = sirf `backend/` folder touch karo
3. Ek prompt mein ek kaam — frontend ya backend, dono nahi
4. Har kaam ke baad: `git add -A && git commit -m "..." && git push`
5. Backend mein koi bhi naya file banao toh relative imports use karo

## Live URLs
- Frontend: https://trikmed.com / https://trikmedcom.vercel.app
- Backend API: https://trikmedweb-production.up.railway.app
- API Docs: https://trikmedweb-production.up.railway.app/docs
