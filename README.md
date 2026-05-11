# Project Tracker Tool

## Executive Summary

Project Tracker Tool is a comprehensive full‑stack project management and bug‑tracking application. It is a **MERN‑style monolith** (React SPA + Node/Express API + MySQL) that provides:

- **Project and Screen Planning** - Complete project lifecycle management
- **Bug Reporting and Tracking** - Comprehensive bug management with assignment and verification workflows
- **Leave and Attendance Management** - Employee leave requests and approvals
- **Task Management** - Consolidated task view organized by type (Projects, Leaves, Bugs, HR, Notifications)
- **Announcements and Notifications** - Company-wide communications
- **Careers and Applications Management** - Job posting and applicant tracking
- **Role‑based Access Control** - Multi-role system (Admin, HR, Tester, Developer, E‑Commerce, Management, Accountant)

The system is optimized to run either entirely on a **local in‑memory data store** (for development) or against a **live MySQL database** (for production), controlled through environment configuration.

---

## Architecture Overview

### High‑Level Architecture

- **Client**: React SPA served by Vite, routing under `basename="/Project_Tracker_Tool"`.
- **Server**: Single Express app (`server/server.js`) exposing REST APIs under a configurable `BASE_URL` (typically `/api`).
- **Database**: MySQL accessed via `mysql2` when `MODE=live`, or an in‑memory `server/data.js` store when `MODE=local`.
- **Authentication**: JWT with HS256, 8‑hour expiry, request‑scoped auth via `Authorization: Bearer <token>` header.
- **Logging & Security**:
  - `helmet` for security headers.
  - `pino-http` with per‑request `x-request-id`.
  - Rate limiting & hard JSON payload limits.
- **Data Access & Enrichment**:
  - `server/repositories/dataRepository.js` for cached data access.
  - `server/services/accessControl.js` and `server/services/enrichment.js` for authorization and view models.
  - `server/audit/activityLogger.js` for project/screen/bug activity log in local mode.

### Runtime Request Flow

1. **Client** uses `authFetch` or raw `fetch` to call `VITE_API_URL` (e.g. `http://localhost:4000/api`).
2. **Server** receives the request at `server/server.js`.
   - Adds a `req.id` and `req.cache` object.
   - Applies `helmet`, `cors`, JSON body parsing.
   - Logs via `pino-http`.
3. **Routing** delegates to route modules mounted under `BASE_URL`:
   - `auth`, `projects`, `screens`, `bugs`, `leaves`, `notifications`, `announcements`, `milestones`, `careers`, `users`, `projectDocuments`, `tasks`.
4. **Authentication middleware** (`authenticate`) verifies JWT and populates `req.user` with `{ userId, email, role, jti }`.
5. **Helpers and services**:
   - `middleware/helpers.js` uses repository + services to fetch and enrich data.
   - In live mode, calls functions from `server/api.js` which run SQL via `pool`.
   - In local mode, uses `server/data.js` in‑memory collections.
6. **Response**:
   - Route handlers send JSON.
   - If any error escapes, the global error handler logs it and returns a normalized JSON error with `requestId`.

### Task Management System

The system features a comprehensive task management system that aggregates tasks from various modules:

**Task Categories**:
- **Project Tasks** - Project assignments and screen assignments
- **Leave Management** - Leave approvals and status updates
- **Bug Management** - Bug assignments, verifications, and deadlines
- **HR Tasks** - Job application reviews
- **Notifications** - Actionable notifications

**Task Collection**: Tasks are automatically collected from:
- Leave requests requiring approval
- Bug assignments and verifications
- Project and screen assignments
- Job applications requiring review
- Actionable notifications

**Project‑Specific Tasks**
A new API endpoint (`GET /tasks/project/:projectId`) aggregates tasks associated with a particular project for the current user.  It returns bugs assigned to the user, verification tasks, upcoming deadlines, screen assignments and project assignments, all filtered by the supplied `projectId` and ordered by priority (then most recent).  The React `ProjectPage` uses this endpoint to render a project‑wise task list.
**Priority System**: Each task has a priority level (high, medium, low) displayed with color-coded badges:
- 🔴 **High Priority** - Critical tasks requiring immediate attention
- 🟡 **Medium Priority** - Important tasks
- 🟢 **Low Priority** - Routine tasks

---

## Repository Structure

```text
Project_Tracker_Tool/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── pages/              # Route pages (Dashboard, Projects, Attendance, etc.)
│   │   ├── components/         # Reusable UI (cards, tables, layout, charts, loaders)
│   │   ├── utils/              # errorHandler, changeDetection, test setup
│   │   ├── auth.js             # Client-side auth helpers (JWT + user in localStorage)
│   │   ├── apiConfig.js        # Base API URL (VITE_API_URL)
│   │   └── Layout.jsx          # Shell layout with sidebar and header
│   ├── public/                 # Static dashboard assets (CSS/JS/images)
│   ├── dist/                   # Built assets (Vite build output)
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS config
│   ├── postcss.config.js       # PostCSS config
│   └── package.json
├── server/                     # Express backend
│   ├── server.js               # Main entrypoint (Express app, middleware, route mounting)
│   ├── routes/                 # Feature-based route modules
│   ├── middleware/             # auth, helpers (facade for access-control & enrichment)
│   ├── repositories/           # dataRepository (cached data access)
│   ├── services/               # accessControl, enrichment, etc.
│   ├── audit/                  # activityLogger
│   ├── config/                 # env validation + runtime config
│   ├── utils/                  # encryption (bcrypt wrappers)
│   ├── db.js                   # MySQL pool
│   ├── data.js                 # In-memory local data (projects, bugs, screens, leaves,…)
│   ├── migrations & scripts/   # migrate_*.js, check_*.js, create_admin.js, etc.
│   ├── .env.example            # Server env template
│   └── package.json
├── test_endpoints.js           # Simple endpoint smoke tester
├── deploy.sh                   # Deployment helper (likely to cPanel or similar)
├── README.md                   # Main project documentation (this file)
├── package.json                # Root scripts to run client/server
└── .gitignore, .htaccess, etc.
```

---

## Platforms & Services

### Backend API (Express / Node.js)

**Purpose**

- Provides RESTful APIs for authentication, projects, screens, bugs, leaves, announcements, notifications, careers, documents, and users.
- Encapsulates business logic, authorization, and data access.

**Tech Stack**

- Node.js, Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- `helmet`, `cors`, `express-rate-limit`, `pino-http`, `zod`, `bcrypt`, `multer`

**Folder Location**

- `server/`

**Entry Point**

- `server/server.js`

**Key Dependencies**

- `express`, `cors`, `helmet`
- `express-rate-limit`
- `mysql2`
- `jsonwebtoken`
- `pino`, `pino-http`
- `zod`
- `bcrypt`
- `uuid`

**Environment Variables**

From `server/.env.example`:

| Variable           | Required | Description                                                  |
|--------------------|----------|--------------------------------------------------------------|
| `PORT`             | Yes      | API server port (default 4000).                             |
| `DB_HOST`          | For live | MySQL host.                                                 |
| `DB_PORT`          | For live | MySQL port (default 3306).                                  |
| `DB_USER`          | For live | MySQL user.                                                 |
| `DB_PASS`          | For live | MySQL password.                                             |
| `DB_NAME`          | For live | MySQL database name.                                        |
| `JWT_SECRET`       | Yes      | Random string (≥ 32 chars) for signing JWTs.                |
| `MODE`             | Yes      | `local` (in-memory `data.js`) or `live` (MySQL).           |
| `BASE_URL`         | Yes      | API base path, typically `/api`.                            |
| `PUBLIC_APP_ORIGIN`| Yes      | Client origin (e.g. `http://localhost:5173`).              |

`server/config/index.js` validates and normalizes this configuration and exposes:

- `MODE`, `USE_LIVE_DB`, `BASE_URL`, `DB` connection info, `PUBLIC_APP_ORIGIN`.

**Setup (Backend)**

```bash
cd server
npm install

# Copy env template
cp .env.example .env
# Edit .env with real values

# Start server
npm start
```

**Deployment Notes**

- `MODE=live` expects a MySQL schema with tables: `users`, `projects`, `screens`, `bugs`, `leaves`, `notifications`, `announcements`, `milestones`, `project_documents`, `jobs`, `applications`, etc.
- Several `migrate_*.js` scripts exist to create/populate tables (`migrate_leaves.js`, `migrate_milestones.js`, `migrate_project_documents.js`, `migrate_careers.js`, etc.).
- Reverse proxy should preserve `x-forwarded-*` headers (server uses `app.set('trust proxy', 1)`).
- CORS restricts origins to `PUBLIC_APP_ORIGIN` plus two localhost ports and allows credentials.

---

### Frontend Web App (React / Vite)

**Purpose**

- Single‑page application for all user roles (Admin, HR, Tester, Developer, etc.).
- Provides dashboards, CRUD UIs for projects/bugs/screens, leave management, announcements, careers, and settings.

**Tech Stack**

- React 18, React Router 6
- Vite
- Tailwind CSS
- Lucide React icons
- ApexCharts + `react-apexcharts` for dashboard charts
- `react-hot-toast` for notifications
- MUI (`@mui/*`) for some UI pieces
- `recharts` for some graphs
- `lottie-react` for animations

**Folder Location**

- `client/`

**Entry Point**

- `client/src/main.jsx` → `client/src/App.jsx`

**Important Config**

- `client/.env.example`:

  ```env
  VITE_API_URL=http://localhost:4000/api
  ```

- `client/src/apiConfig.js` reads `VITE_API_URL` and exports `API_BASE_URL` for all API calls.

**Scripts**

```bash
cd client
npm install

# Dev server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

**Deployment Notes**

- SPA is served under `basename="/Project_Tracker_Tool"` in `App.jsx`.  
  Reverse proxies must route `/Project_Tracker_Tool/*` to the built `index.html`.
- `VITE_API_URL` must point to the backend’s `BASE_URL` (e.g. `https://api.example.com/api`).

---

## Complete System Flow Documentation

### A. User & Auth Flows

#### Email/Password Login

**Trigger**

- User submits login form on `Login.jsx`.

**Client Behavior**

1. Validate email and password with `validateField`.
2. `fetch(`${API_BASE_URL}/login`, { method: 'POST', body: { email, password } })`.
3. On success:
   - `saveToken(data.token)` → localStorage.
   - `saveUser(data.user)` → localStorage.
   - Redirect:
     - HR → `/notifications`
     - Others → `/dashboard`
4. On failure:
   - `handleApiResponse` throws; `handleError` shows a toast.

**API Request**

- `POST /login`
- Body: `{ email, password }`.

**Backend Processing**

1. `routes/auth.js`:
   - `getUsers(req)` loads users (from DB or `data.js`).
   - Find user by `email`.
   - Check `active` flag.
   - Compare password via `comparePassword`:
     - If plaintext legacy password matches, upgrade to bcrypt and persist.
   - Generate JWT with `HS256`, expiry `8h`, includes `{ userId, email, role, jti }`.
2. Return `{ token, user: { id, name, email, role, profilePicture } }`.

**Database Interaction**

- Live mode: MySQL `users` table via `api.js`.
- Local mode: `data.js.users`.

**Session Restore**

- `PrivateRoute` (`App.jsx`) reads `getToken()` and `getUser()` each render.
- If no token → redirect `/login`.
- No server call on first render; APIs are authenticated per request via `authFetch`.

#### Logout

**Client**

- Not centralized, but where logout is used it clears:
  - `clearToken()`, `clearUser()` in `auth.js`.
- Any 401 response from `authFetch` automatically clears token and user and throws.

**API**

- `POST /logout` adds current token to in‑memory `tokenBlacklist` in `auth.js`.  
  Further use of that token yields `401 Token revoked`.

#### Get Current User

- `GET /me` with `Authorization: Bearer <token>`.
- `authenticate` validates token; returns current user summary.

### B. Application Feature Flows

Below are the main flows across features.

#### 1) Leave Request Flow (Attendance → /leaves)

**Trigger**

- User clicks “Request Leave” button on `Attendance.jsx`.

**Client Behavior**

1. Open modal with `leaveForm` state containing:
   - `type`, `start_date`, `end_date`, `half_day_period`,
   - `short_leave_time`, `compensation_worked_date`,
   - `compensation_worked_time`, `reason`, `is_emergency`.
2. On submit:
   - Local validations:
     - Past date disallowed except `Compensation`.
     - Full Day/Paid Leave require ≥ 3 days’ notice unless `is_emergency`.
     - Warn when >2 Short/Early leaves in a month.
3. `authFetch(POST /leaves)` with form payload.
4. On success:
   - Show success toast.
   - Close modal.
   - Reload leaves + summary via `loadData()`.

**Backend Processing**

- `POST /leaves` (`routes/leaves.js`):
  - Rejects admin users from requesting leaves.
  - Determines approver role (HR/Admin) and sets initial `status='Submitted'`.
  - Enforces rules:
    - No past dates (except Compensation).
    - 3‑day advance rule for `Paid Leave` and `Full Day`.
    - Max 2 Short/Early leaves per month (currently only counted; warning handled client‑side).
    - Max 1 Paid Leave per month (enforced).
    - No overlapping active leaves.
  - Creates `leaves` row via `createLeaveInDbSource` (MySQL or local).
  - Sends `leave_request` notifications to HR/Admin depending on requester’s role.

**Database Interaction**

- Live:
  - `INSERT INTO leaves (...) VALUES (...)` with approver ID and flags.
  - `INSERT INTO notifications (...)` for relevant approvers.
- Local:
  - Push into `data.leaves` and `data.notifications`.

**UI/State Update**

- `Attendance.jsx` reloads:
  - `GET /leaves` → `leaves` state.
  - `GET /leaves/stats/summary` → `summary` cards.
- Tabs/filters rerender accordingly.

#### 2) Leave Approval Flow

**Trigger**

- HR/Admin opens “Leave Request Details” modal from the main leave table (`Attendance.jsx`), on `Pending for Approval` or other relevant tab.

**Client Behavior**

1. `selectedLeave` populated and modal opened.
2. Approver clicks **Approve** or **Reject**:
   - Opens `ConfirmDialog` with contextual message.
   - On confirm: `handleStatusUpdate(id, 'Approved' | 'Rejected')`.

**API Request**

- `PATCH /leaves/:id/status` body `{ status: 'Approved' | 'Rejected' }`.

**Backend Processing**

- `routes/leaves.js`:
  - `authenticate` + `isAdminOrHR`.
  - Loads leave and owning user.
  - Validates whether approver (admin or HR) is allowed based on user role:
    - Admin can approve anyone.
    - HR can approve testers, developers, ecommerce, management, accountant.
  - Updates `leaves` row (status, approver_id).
  - Creates `leave_status` notification to requester summarizing decision.

**UI/State Update**

- Client reloads leaves via `loadData()`.
- Notification list (`Notifications.jsx`) will show a new item for the user.

#### 3) Leave Cancellation Flow

**Trigger**

- Requester views their leave in “My Leaves History” tab and clicks **Cancel** on a leave with `Submitted` or `Pending Approval`.

**Client Behavior**

1. `ConfirmDialog` asks for confirmation.
2. On confirm, `authFetch(PATCH /leaves/:id/cancel)`.

**Backend Processing**

- Validates leave belongs to current user and is pending.
- Marks status as `Cancelled`.
- Sends `leave_cancelled` notification to the approver role (HR or Admin depending on user role).

**UI Update**

- Table data refreshed; leave status becomes `Cancelled`.

#### 4) Leave History Flow (`/leaves/history`)

**Trigger**

- User scrolls to “Leave History” section on `Attendance.jsx`.
- Adjusts **Year**, **Month**, **Status**, and/or **Search** filters.

**Client Behavior**

- `historySearchTerm`, `historyStatus`, `selectedYear`, `selectedMonth` drive a `useEffect`:

```js
fetchLeaveHistory(selectedYear, selectedMonth, historySearchTerm, historyStatus)
```

- `fetchLeaveHistory` builds URL:

```text
GET /leaves/history?year=YYYY&month=MM|all&status=STATUS|all&search=query
```

**Backend Processing**

1. `authenticate` ensures JWT.
2. `getLeaves(req)` returns all leaves accessible to user.
3. Role filtering:
   - Admin/HR → all.
   - Others → only leaves where `user_id === req.user.userId`.
4. Year/month filter based on `start_date`.
5. If `search` provided:
   - Filter by `userName` substring (case‑insensitive).
6. If `status` not `all`:
   - Filter by equality on `status`.
7. Return normalized objects with all fields required by the history table.

**UI/State Update**

- `historyRecords` updated.
- `Table` shows **Applied On, Employee, Leave Type, Period, Duration, Details, Status** for the filtered set.

#### 5) Projects & Screens Flow

**Trigger**

- User navigates to `/projects` or `/projects/:id`.

**Client Behavior**

- `Projects.jsx`:
  - Fetch `GET /projects` via `authFetch`.
  - Presents cards/table with projects assigned to user or all (admin).

- `ProjectPage.jsx`:
  - On mount: `GET /projects/:id` to fetch enriched project, including:
    - Screens list (`screensList`).
    - Bugs list (`bugsList`).
    - Additional project metadata.

**Backend Processing**

- `GET /projects`:
  - Admin → all projects.
  - Others → filter based on role and assignment (tester or developer/ecommerce on that project).
  - `enrichProject` attaches counts, derived metrics, maybe last activity.

- `GET /projects/:id`:
  - Ensures `hasProjectAccess`.
  - Calls `enrichProject`.
  - Adds `screensList` via `getScreens(req, id)` and `bugsList` via `getBugs(req, id)` + `enrichBug`.

**Database Interaction**

- Live:
  - `projects`, `screens`, `bugs` tables.
  - Developer IDs stored as JSON string in `projects.developerIds`.

#### 6) Bug Lifecycle Flow

- **Listing**:
  - `GET /bugs` returns bugs accessible to user (based on associated projects).
  - `GET /projects/:id/bugs` returns all bugs for a project; enriched with human‑readable fields.

- **Creation**:
  - `POST /projects/:id/bugs` (tester/admin):
    - Validates project and assigned developer.
    - Uses per‑project bug counter to assign `bugNumber`.
    - Persists new `bug` with `status='Open'`, `severity`, `deadline`, etc.
    - Logs activity.

- **Update**:
  - `PATCH /bugs/:id` updates description, severity, status, etc. through `updateBugInDbSource` + activity logging (not fully shown but follows same pattern).

- **Bug Statistics**:
  - `GET /bugs/stats/:year` aggregates monthly bug counts, used by `Dashboard.jsx` to render bug trend area chart.

#### 7) Notifications Flow

**Trigger**

- Any event that calls `createNotificationInDbSource`:
  - Leave request, leave status change, leave cancellation, possibly others (announcements, careers, etc.).

**Backend**

- `routes/notifications.js`:
  - `GET /notifications`: calls `getNotifications(req, userId)` from repository, returning last notifications for user.
  - `POST /notifications/mark-all-read`: sets user’s notifications `status='read'`.
  - `POST /notifications/:id/mark-read`: marks a single notification read.

**Client**

- `Notifications.jsx`:
  - On mount: `GET /notifications`.
  - Shows cards with gradient icons based on `type` (leave_request, leave_cancelled, leave_status, project_assignment, etc.).
  - “View Details” button navigates:
    - Leave requests → `/attendance` with appropriate tab.
  - “Mark all as read” calls `POST /notifications/mark-all-read`.

#### 8) Careers Flow

- **Listing Jobs**:
  - `GET /careers/jobs` (from `routes/careers.js` – not fully shown here but part of API).
  - `Careers.jsx` shows open job postings, statuses, and allows admin management.

- **Applications**:
  - Routes in `careers.js` and `api.js` manage `applications` table:
    - `POST /careers/applications`, `GET /careers/applications`, etc.
  - `Careers.jsx` uses these to show applications per job and update statuses.

#### 9) Announcements & Dashboard

- **Announcements**:
  - `routes/announcements.js` manages CRUD for `announcements` table.
  - `Announcements.jsx` provides UI for admins to create, edit, and deactivate announcements.
  - Dashboard fetches recent announcements to show at top.

- **Dashboard Metrics**:
  - `Dashboard.jsx` pulls multiple endpoints:
    - `GET /projects`, `GET /bugs`, `GET /bugs/stats/:year`, `GET /screens`, `GET /leaves/stats/summary`.
  - Uses `ChartComponents.jsx` to render:
    - Bug trend (area chart).
    - Projects by status (donut).
    - Pareto of module‑wise issues (Pareto chart).
  - Summary cards show total projects, running/completed/on‑hold, open bugs, upcoming deadlines, etc.

### C. Internal System Flows

#### Request Lifecycle

1. Request hits `server/server.js`.
2. `req.cache` initialized with common collections.
3. `helmet` and `cors` applied (CORS denies non‑whitelisted origins).
4. `express.json` and `express.urlencoded` parse bodies.
5. `/uploads` static serve configured with caching.
6. Routes mounted under `BASE_URL`:
   - Each route optionally uses `authenticate` and `requireRole`.
   - Business logic leverages `helpers.js`, which pulls from:
     - `dataRepository` for cached access to DB or `data.js`.
     - `accessControl` and `enrichment` for per‑role filtering and computed fields.
7. Errors bubble to the global error handler and are logged with `pino`.

#### Validation Pipeline

- Env config validated via `zod` in `config/index.js`.
- Request body validation is mostly manual in routes (checking for required fields).
- Some DB operations in `api.js` perform extra checks; leave and bug routes include guard branches for required fields and role compatibility.

#### Error Handling

- Explicit `400`, `403`, `404` responses throughout.
- Unknown routes → 404 JSON with `{ error, path }`.
- Global handler:
  - Logs `err` with `req.log.error`.
  - Returns `{ error, requestId }`, masking internals for 5xx.

### D. Data & State Flow

#### Client State

- Predominantly managed via React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
- No centralized state manager (e.g. Redux); pages fetch their own data.
- `auth.js` uses `localStorage` for JWT and user object.

#### Caching

- Server:
  - Request‑level cache (`req.cache`) used by `dataRepository` to avoid repeated DB hits within the same request.
- Client:
  - Derived state computed with `useMemo` (e.g. filtered leaves, bug charts).

### E. Platform Communication

- **Client ↔ API**: All communication is HTTP/JSON using `VITE_API_URL` + `BASE_URL`.
- **Auth Sharing**:
  - Single JWT used for all routes; no session cookies.
  - Client attaches JWT via `Authorization: Bearer` header.

### F. Background & Automation

- No long‑running workers or queues in this repo.
- One‑off scripts for:
  - Database migrations: `migrate_*`.
  - Data checks: `check_db.js`, `check_bugs_table.js`.
  - Admin bootstrap: `create_admin.js`.
  - Notification table creation: `create_notifications_table.js`.
- These are intended to be run manually or wired into CI/CD.

### G. External Integrations

- **Database**: MySQL via `mysql2`.
- **Supabase**: Some scripts (`insert_projects_to_supabase.js`) suggest optional export; runtime doesn’t depend on Supabase.
- **Lottie**: UI-level animation via `lottie-react`.
- No payment, email, or OAuth providers are wired directly in this repo.

### H. End‑to‑End User Journeys

#### User Login Journey

1. User opens `/login`.
2. `Login.jsx` checks `getToken()`; if present, navigates to `/dashboard`.
3. User enters email/password and submits.
4. Frontend validates inputs, calls `POST /login`.
5. Backend validates credentials and returns JWT + user.
6. Frontend stores token/user and redirects:
   - HR → `/notifications`.
   - Others → `/dashboard`.
7. Dashboard loads metrics via multiple API calls and shows summary cards/charts.

#### Primary Developer Journey (Bug Flow)

1. Developer logs in.
2. Navigates to `/projects`.
3. Sees only projects they are assigned to via `GET /projects`.
4. Opens a project → `GET /projects/:id` returns enriched project, screens, and bugs.
5. For a specific bug:
   - View bug details (enriched), update status via bug APIs.
6. Dashboard bug trend (`GET /bugs/stats/:year`) reflects activity over time.

#### HR Leave Management Journey

1. HR logs in and is redirected to `/notifications`.
2. Notifications highlight new `leave_request` events.
3. HR clicks **View Details**, navigates to `/attendance` with `pendingApproval` tab active.
4. HR opens a pending leave, approves or rejects.
5. Requester receives `leave_status` notification and sees updated status in “My Leaves History” and Leave History.

#### Admin Workflow (Projects & Users)

1. Admin logs in, navigates to `/users` to manage user roles and activation.
2. Admin navigates to `/projects` to create or update projects via:
   - `POST /projects`
   - `PATCH /projects/:id`
   - `DELETE /projects/:id`
3. Admin monitors leave summary in `/attendance` and high‑level metrics on `/dashboard`.

#### Logout / Session Expiry

1. User’s JWT expires or is revoked via `/logout`.
2. Next authenticated request via `authFetch` gets `401`.
3. `authFetch` clears token and user data, throws an error.
4. Page‑level logic (like `handleAuthError` in `Dashboard.jsx`) redirects user to `/login`.

---

## Environment Configuration

### Server `.env`

See table above; recommended minimal config for local development:

```env
PORT=4000
MODE=local
BASE_URL=/api
PUBLIC_APP_ORIGIN=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_string_at_least_32_chars
# DB_* only needed when MODE=live
```

### Client `.env`

```env
VITE_API_URL=http://localhost:4000/api
```

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm
- MySQL (for live mode; optional for `MODE=local`)

### Startup Order

1. **Backend**

   ```bash
   cd server
   cp .env.example .env   # adjust as needed
   npm install
   npm start
   ```

2. **Frontend**

   ```bash
   cd client
   cp .env.example .env   # adjust VITE_API_URL if necessary
   npm install
   npm run dev
   ```

3. Visit the app at:

   ```text
   http://localhost:5173/Project_Tracker_Tool/
   ```

---

## Scripts & Automation

### Root `package.json`

```json
"scripts": {
  "client": "npm run dev --prefix client",
  "server": "npm run start --prefix server",
  "dev": "npm run server",
  "start": "npm run server"
}
```

- Use `npm run server` at the root to start the backend; frontend is started from `client/`.

### Backend

- `npm start`: starts Express server (`server.js`).

### Frontend

- `npm run dev`: Vite dev server.
- `npm run build`: Production bundle.
- `npm run preview`: Preview production bundle locally.

### Testing Endpoints

- `node test_endpoints.js` (from repo root) can be used as a lightweight smoke test for key APIs (as implemented in that script).

---

## Database & Migrations

- **MySQL schema** is managed by a collection of migration scripts in `server/`:
  - `migrate_leaves.js`, `migrate_milestones.js`, `migrate_project_documents.js`, `migrate_careers.js`, etc.
  - Each script connects via `db.js` and runs `CREATE TABLE IF NOT EXISTS ...` SQL statements.

**Typical Migration Usage**

```bash
cd server
node migrate_leaves.js
node migrate_milestones.js
# ... run other migrations as needed
```

There is no centralized migration framework (like knex or Sequelize); scripts are plain Node files.

---

## Deployment Architecture

- **Backend**: Single Node process (Express) behind a reverse proxy (nginx/cPanel/etc.) with:
  - `BASE_URL` used as prefix.
  - `PUBLIC_APP_ORIGIN` set to deployed SPA domain.
- **Frontend**: Static Vite build served:
  - Either from `client/dist` via nginx/Apache.
  - Or uploaded via cPanel, honoring `basename="/Project_Tracker_Tool"`.

No Docker or CI/CD definitions are included in the repo, but `deploy.sh` suggests a shell‑based deployment pipeline can call `npm run build` and sync assets to hosting.

---

## Troubleshooting

| Symptom                                      | Likely Cause                                      | Fix |
|----------------------------------------------|---------------------------------------------------|-----|
| `Invalid environment configuration` on boot  | Missing or invalid server `.env` values           | Check `JWT_SECRET`, `PUBLIC_APP_ORIGIN`, `MODE`, `BASE_URL`. |
| CORS errors from browser                     | `PUBLIC_APP_ORIGIN` mismatch                      | Ensure it matches the exact origin (scheme + host + port). |
| 401 “Invalid token” from API                 | Expired/revoked token or wrong `JWT_SECRET`       | Re‑login; ensure frontend and backend share the same JWT secret. |
| Empty Leave History                          | Filters too restrictive (year/month/status)       | Set `Month = All` and `Status = All` and clear search. |
| Projects/Bugs missing for non‑admin user     | User not assigned as tester/developer/ecommerce   | Check `projects.developerIds` and `testerId` in DB. |

---

## Developer Onboarding

### First‑Time Checklist

1. Clone repo and install dependencies in `server/` and `client/`.
2. Configure `server/.env` (use `MODE=local` initially) and `client/.env`.
3. Run `npm start` in `server/` and `npm run dev` in `client/`.
4. Seed local data or run migration scripts if using MySQL.
5. Explore:
   - `client/src/pages/Dashboard.jsx` for metrics.
   - `client/src/pages/Attendance.jsx` for leave logic.
   - `server/routes/leaves.js`, `server/routes/projects.js`, `server/routes/bugs.js` for API patterns.

### Recommended Development Workflow

- Implement backend changes in route modules and services.
- Use `test_endpoints.js` or Postman to validate APIs.
- Update frontend pages to consume new endpoints via `authFetch`.
- Keep role checks consistent between frontend (PrivateRoute/conditional UI) and backend (`requireRole`, `hasProjectAccess`).

---

## Contributing Guidelines

- Follow existing coding style:
  - Backend: CommonJS modules, async/await, explicit error responses.
  - Frontend: Functional components with hooks, Tailwind classes, React Router v6 patterns.
- Keep feature logic localized (per route file and per page) unless it truly belongs in a shared service.
- When adding new APIs:
  - Wire them through `server/server.js` under `BASE_URL`.
  - Use `authenticate` and `requireRole` where appropriate.
  - Add a short entry to the README’s API overview if it’s a major feature.

---

## License

This project is private and for internal use only.