# Backend (Express + MongoDB)

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. For email notifications, set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (example: `FamilyOrg <no-reply@yourdomain.com>`).
3. Optional: set `APP_URL` so email links point to your frontend (example: `http://localhost:5173`).
4. npm install
5. npm run dev

APIs:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me (protected)

Dashboard endpoints:
- GET /api/dashboard/summary (protected) — returns summary counts and short lists for dashboard widgets
- POST /api/dashboard/seed — create demo data (only allowed in non-production environments)

Note: Use the `/dashboard/seed` endpoint locally to populate demo data for the dashboard UI.