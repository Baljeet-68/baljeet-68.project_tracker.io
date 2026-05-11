# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development — run separately in two terminals
npm run client          # Vite dev server for React frontend (client/)
npm run server          # Node.js Express server (server/)

# Client only
cd client
npm run dev             # Vite dev server
npm run build           # Production build
npm run preview         # Preview built output

# Testing (client)
cd client
npx vitest              # Run tests (Vitest + jsdom + @testing-library/react)
npx vitest run          # Single run (no watch)

# Server only
cd server
npm start               # node server.js

# Database migrations (run from server/)
node migrate_projects.js
node migrate_screens.js
node migrate_bugs_attachments.js
node migrate_leaves.js
node migrate_milestones.js
node migrate_careers.js
node migrate_project_documents.js

# Create initial admin user
node create_admin.js
```

## Environment Setup

Server requires `server/.env`:
```
PORT=4000
MODE=local          # 'local' = in-memory, 'live' = MySQL
JWT_SECRET=<min 32 chars>
BASE_URL=/api
PUBLIC_APP_ORIGIN=http://localhost:5173

# Only needed when MODE=live
DB_HOST=localhost
DB_PORT=3306
DB_USER=username
DB_PASS=password
DB_NAME=database_name
```

`MODE=local` runs entirely in-memory with seeded data — no database needed for development.

## Architecture

**Monorepo with two separate apps:**
- `client/` — React 18 SPA (Vite, Tailwind CSS, React Router 6)
- `server/` — Express 4 REST API (Node.js, MySQL or in-memory)

### Server Data Layer

The server has two parallel data backends, selected by `MODE` env var:

| File | Purpose |
|------|---------|
| `server/data.js` | In-memory JS objects (local mode) |
| `server/api.js` | Raw SQL queries via mysql2 pool (live mode) |
| `server/db.js` | MySQL connection pool (10 connections) |
| `server/repositories/dataRepository.js` | Request-scoped caching layer over both |

**Never add business logic to `api.js` or `data.js`** — keep those as pure data access. Business logic lives in `server/services/`.

### Server Services

- `services/accessControl.js` — role-based authorization (what each role can see/do)
- `services/enrichment.js` — adds user names, avatar URLs, etc. to raw data
- `services/taskService.js` — aggregates tasks from screens and bugs
- `middleware/auth.js` — JWT verification; maintains in-memory token blacklist (logout)
- `audit/activityLogger.js` — logs create/update/delete actions to activities table

### Request Flow

```
Request → auth middleware (JWT verify) → route handler → repository (cached) → api.js/data.js
                                      → access control (services/accessControl.js)
                                      → enrichment (services/enrichment.js)
                                      → Response
```

### Client Structure

- `client/src/App.jsx` — All routes; `PrivateRoute` checks JWT + role
- `client/src/auth.js` — `authFetch()` helper auto-adds `Authorization: Bearer` header; handles 401 redirects
- `client/src/apiConfig.js` — `API_BASE_URL` — set to `http://localhost:4000/api` in dev
- `client/src/Layout.jsx` — Shell with sidebar and header wrapping all protected pages
- `client/src/pages/` — One file per top-level route
- `client/src/modules/projects/` — Project feature: main page + tabs (Overview, Screens, Bugs, Milestones, Documents, Activity, Tasks) + dialogs
- `client/src/components/dashboard/` — Role-specific dashboard views (Admin, Developer, Tester, HR, Management)

### Roles

`Admin`, `HR`, `Tester`, `Developer`, `E-Commerce`, `Management`, `Accountant`

Access control is enforced server-side in `services/accessControl.js`. Client-side role checks are for UI only (hiding/showing elements), not for security.

### Authentication

- JWT HS256, 8-hour expiry, stored in `localStorage`
- Payload: `{ userId, email, role, jti }`
- Logout adds `jti` to an in-memory blacklist — **not persistent across server restarts**
- Plain-text passwords auto-upgrade to bcrypt on first login (migration path)

### API Response Conventions

- All routes under `BASE_URL` (default `/api`)
- Errors include a `requestId` field for log correlation
- Standard HTTP status codes: 400 validation, 401 auth, 403 forbidden, 404 not found

### File Uploads

- `multer` stores uploads in `server/uploads/`
- URLs built by `server/lib/urlBuilder.js` using `PUBLIC_APP_ORIGIN`
- Bug attachments and profile pictures use this mechanism
