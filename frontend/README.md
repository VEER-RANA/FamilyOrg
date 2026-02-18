# Frontend (React)

This folder contains a minimal React app scaffold for FamilyOrg (Vite-style).

Quick start:

1. cd frontend
2. npm install
3. npm run dev

Notes:
- The frontend expects the API at `http://localhost:5000/api` by default. You can override by setting `VITE_API_BASE` in an `.env` file in the `frontend/` folder.
- Implemented: **Auth context**, **Login**, **Register**, and a **Protected route** example.

Next: wire auth to protected backend endpoints and add event pages.
