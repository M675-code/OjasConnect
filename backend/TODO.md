# Ojas_Connect Backend & Frontend Overhaul - TODO (Updated 2026-04-24)

This file documents what I've identified, what I implemented so far, the current project layout, how to run the app locally, and a prioritized, actionable roadmap. I also list the small, safe changes I'll start implementing immediately given your note that the active user base is expected to be <= 1000 (so client-side faceting is acceptable initially).

---

## Executive summary (what I found & fixed)

- Performed a full pass across backend and frontend. Major problems found and addressed:
  - Backend refactor: moved from monolithic server.js to a modular `src/` layout (app, routes, controllers, services, middleware, db/pool).
  - Created a JS migration-runner and several idempotent JS migrations to safely add audit logging and soft-delete support.
  - Fixed repeated migration failures by making foreign-key and enum migrations idempotent (check INFORMATION_SCHEMA before altering schema).
  - Fixed many runtime issues: prepared-statement LIMIT/OFFSET problems (embedded numeric LIMIT/OFFSET in directory queries), enum mismatch errors (safe enum update migration), and missing `deleted_at` errors (controller fallbacks + migration to add column).
  - Frontend consolidation: ensured client uses `VITE_API_URL` and simplified response parsing for directory results.
  - Directory page: search, status filter, highlighting, responsive cards, admin Edit + Deactivate/Reinstate actions implemented. Replaced native confirm() with an accessible modal that requires a short reason for audit logs.
  - Admin flows: created admin CRUD endpoints (list, update, soft-delete, restore) with JWT role checks and wired basic audit logging in code.
  - Added client-side validation (AdminPanel) with inline errors, red borders and autofocus to first invalid field.

What remains: run and verify the migrations on your DB, and finalize a small set of UX/Search improvements for the Directory to make discovery easier.

---

## Current project layout (high level)

- backend/
  - server.js (bootstrap)
  - package.json
  - src/
    - app.js
    - db/
      - pool.js
      - migrate-runner.js
      - migrations/ (sql + js migrations)
    - routes/ (users.js, events.js, ...)
    - controllers/ (usersController.js, directoryController.js, ...)
    - services/ (userService.js, auditService.js, ...)
    - middleware/ (auth, role, validators, error handler)
    - validators/
- frontend/
  - vite + react app
  - src/pages/Directory.jsx (directory UI + admin modal)
  - src/pages/AdminPanel.jsx (onboarding with validation)
  - src/pages/AdminEditUser.jsx

---

## How to run locally (quick)

1) Backend
   - cd "d:\\Vs_React_Native\\Ojas_Connect\\backend"
   - npm install
   - ensure `.env` exists with DB connection and `JWT_SECRET`
   - Run migrations (recommended): `node src/db/migrate-runner.js`
   - Start dev server: `npm run dev` (or `node server.js`)

2) Frontend
   - cd "d:\\Vs_React_Native\\Ojas_Connect\\frontend"
   - npm install
   - create `frontend/.env` with `VITE_API_URL=http://localhost:5000`
   - Start dev server: `npm run dev` (Vite default: http://localhost:5173)

---

## Completed (what I've implemented so far)

- Backend modularization and db/pool centralization.
- Migration runner + safe idempotent migrations scaffolding.
- Safe JS migrations to:
  - Add `audit_logs` table (migration created; run it to ensure table exists).
  - Add `deleted_at` column to `users` (migration created; run to add column).
  - Expand `users.status` enum safely to include `active, inactive, suspended, invited, deleted` (JS migration created).
- Directory endpoint hardened against prepared-statement LIMIT/OFFSET issues.
- Admin CRUD endpoints added + RBAC middleware enforced.
- Frontend Directory improvements:
  - Uses `VITE_API_URL`.
  - Search highlighting.
  - Admin Edit page link.
  - Deactivate/Reinstate modal that requires a reason (sent to backend in request body).
  - Shorter button labels with hover tooltips and ARIA labels.
- AdminPanel: per-field validation, asterisks, red-border/error focus behavior.
- Audit service added in backend; actions record audit entries in code (DB table must be created by running migrations).

---

## Immediate issues you must run/verify (important)

1. Run the migrations from the backend folder:
   - `node src/db/migrate-runner.js`
   - Verify the runner reports `Migration succeeded:` or `Migration executed:` for each file.
2. Confirm DB changes:
   - `SELECT COUNT(*) FROM users WHERE status = 'active';` (Directory depends on active users being present)
   - `SHOW TABLES LIKE 'audit_logs';` and `SHOW COLUMNS FROM users LIKE 'deleted_at';`
3. If migrations report errors, copy the full migration-runner output here and I will patch the offending migration to be idempotent and safe.

---

## Prioritized roadmap (actionable, with assumed <=1000 users)

Notes on scale: because you expect <1000 active users for now we can safely perform some client-side faceting (fetch a page or all results and do client-side filters for industry/job) while implementing server-side faceting/sorting/pagination as next step.

Priority A — Must-have (implement next)
1) (STARTING) Improve Directory discovery UX (frontend-first, low risk):
   - Add industry (business category) and job/profession filters (dropdowns) and wire them to the Directory API as query params.
   - Add debounced search input (300ms) to reduce requests while typing.
   - Add page/size support UI (simple pager or Load more) and default size=20.
   - Client-side faceting fallback: if backend metadata endpoints are not present, derive filter options from returned users (OK for <=1000 users).
   - Estimated effort: 1–3 hours.
   - Implementation status: I will implement the frontend portion now (industry/job filters + debounce + client-side options). Backend support for industry/job filters and pagination should follow (small change in directoryController).

2) Persist audit reason server-side (very small):
   - Ensure the `reason` sent from the modal is stored in `audit_logs.details` when admin performs delete/restore.
   - Add server-side validation to require a reason for audit actions.
   - Estimated effort: 30–60 minutes.

Priority B — High value
3) Server-side filtering, faceting, and sorting:
   - Accept query params: `page`, `size`, `search`, `status`, `industry`, `job_title`, `location`, `sort`.
   - Add DB indexes for `status`, `last_name`, `business_name`, and `industry`. Consider FULLTEXT index on `first_name,last_name,business_name` later.
   - Add endpoints to return metadata: `/api/meta/industries`, `/api/meta/job_titles`, `/api/meta/locations`.
   - Estimated effort: 3–6 hours (backend + migration for indexes).

4) Admin UX improvements
   - Replace native confirm with modal (done). Replace remaining native confirms if any.
   - Replace native confirm-based bulk actions with a proper modal for bulk deactivate with required reason and preview.
   - Add Admin Audit view to browse `audit_logs` and filter by actor, action, date range.
   - Estimated effort: medium.

Priority C — Nice to have
5) CSV export / bulk import for admins.
6) Invite/email flow (one-time links) and password reset.
7) Profile images using S3 or similar.
8) Integration tests for admin CRUD and migrations.

---

## Security & validation notes
- All admin endpoints require an admin JWT. Ensure `JWT_SECRET` is set in `.env` and tokens are generated accordingly.
- Server-side validation of enums is required before writing to DB (status, role, marital_status). Some validators exist but add unit tests.
- Audit logs should record actor id, timestamp, target id, action, and the modal-provided reason.

---

## Which item I will start implementing now

- I will implement the frontend Directory improvements from Priority A now: add industry and job filters, debounced search (300ms), and client-side derived filter options. This is low-risk, improves discoverability immediately, and does not require DB changes.
- After that, I will implement the small backend change to ensure the `reason` provided by the modal is persisted to `audit_logs.details` for admin delete/restore actions (requires verifying the `audit_logs` table exists). I'll run that once you confirm migrations were executed or want me to run them.

---

## How you can help / next actions for you
1. Run db migrations: `node src/db/migrate-runner.js` and paste output if any migration fails.
2. If DB is empty, load test data using the provided dump or create a few active users so Directory shows results.
3. Confirm you want me to continue and implement the frontend Directory changes now (I already will begin them). If you prefer, I can implement the server-side reason persistence first.

---

Last update: 2026-04-24
