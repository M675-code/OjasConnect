Ojas Connect - Backend

Technical Overview

Project layout (backend):

- server.js - app bootstrap
- src/
  - app.js - express app configuration (helmet, cors, morgan, rate limiting)
  - db/
    - pool.js - MySQL connection pool
    - migrations/ - migration files (SQL & JS)
    - migrate-runner.js - runs migrations
  - routes/ - Express routers (users.js, events.js)
  - controllers/ - Controllers that handle requests and return responses
  - services/ - Business logic and DB transactions (userService, eventsService)
  - middleware/ - authMiddleware, roleMiddleware, errorHandler
  - validators/ - express-validator schemas for requests
  - scripts/ - misc scripts (e.g. fix-passwords.js)
  - tests/ - integration/unit tests (mocha + supertest)

Key Technologies
- Node.js + Express
- MySQL (mysql2)
- JWT for authentication (jsonwebtoken)
- bcrypt for password hashing
- express-validator for request validation
- helmet, morgan, express-rate-limit for security and logging

Database
- The app expects a MySQL database defined by the `.env` variables.
- Migrations are located in `src/db/migrations`. Use `npm run migrate` to execute them.

Security & Auth
- Passwords are hashed with bcrypt. Never return `password_hash` in API responses.
- JWT tokens are signed using `JWT_SECRET` and expire in 24h by default.

Features / Modules (Business Section)

1) Authentication
- Login (POST /api/login) - authenticates active users and issues JWT.
- Invite flow (POST /api/invite) - admin can create invite tokens for new users (token email sending is TODO).

2) Users & Directory
- Create user (POST /api/admin/users) - multi-table transactional creation for user, spouse, kids, businesses, jobs.
- Profile (GET /api/users/:id) - fetch profile with related spouse, kids, businesses, jobs.
- Directory (GET /api/directory) - paginated endpoint with filters (status, industry, search) for member directory.

3) Events
- CRUD basic event creation (restricted to admin/event_manager), listing, RSVP support.

4) Relations & Business Rules
- Spouses, kids, businesses, jobs are related to users via FK constraints.
- Business rules: marital_status should align with spouse entries. Transactions ensure consistency.

5) Admin Tools (planned)
- Merge users, soft-delete support, CSV import/export, audit logs.

How to run (local)
1) Backend
   - Install deps: cd backend; npm install
   - Create `.env` with DB credentials + JWT_SECRET
   - Run migrations: npm run migrate
   - Start dev server: npm run dev

2) Frontend
   - cd frontend; npm install; npm run dev

Notes
- The repo currently does not include email provider credentials. Configure SMTP/API keys before enabling invite emails or password resets.
- Consider adding soft-delete and audit logging before running destructive admin scripts.

Contact & Maintainers
- Solo developer project. Keep `.env` secure and do not commit secrets.
