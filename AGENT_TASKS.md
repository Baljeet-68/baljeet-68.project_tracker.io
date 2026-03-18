# AI Agent Task List — Project Tracker Tool
> Auto-generated from full codebase review. Work top-to-bottom. Mark each task `[x]` when done.

---

## PRIORITY 1 — CRITICAL BUGS (fix before anything else)

- [ ] **FIX** `client/src/pages/ProjectPage.jsx` — add `getToken` to import from `'../auth'` (line ~1, missing import causes document upload to throw `ReferenceError` at runtime)
- [ ] **FIX** `client/src/components/dashboard/ManagementDashboard.jsx` — replace hardcoded `85%`, `78%`, `92%` KPI values with real computed values from `dashboardData` (`bugAnalytics`, `projectHealth`)
- [ ] **FIX** `client/src/components/dashboard/ManagementDashboard.jsx` — replace hardcoded bug trend array `[12, 18, 15, 22, 28, 25, 30]` with real API data or remove the chart entirely
- [ ] **FIX** `client/src/components/dashboard/DeveloperDashboard.jsx` — change broken `href="/bugs"` link to `/projects` (route `/bugs` does not exist in `App.jsx`)
- [ ] **FIX** `client/src/components/dashboard/common.jsx` — `LeaveBreakdown` uses dynamic Tailwind class `bg-${leave.color}-500` which gets purged by JIT; replace with inline `style={{ backgroundColor: ... }}` using a color map
- [ ] **FIX** `client/src/components/dashboard/TesterDashboard.jsx` — remove fabricated severity math (`open * 0.3`, `open * 0.35`, etc.); show `0` or `—` until backend provides `bySeverity` breakdown
- [ ] **FIX** `client/src/components/dashboard/HRDashboard.jsx` — remove the duplicate named `Dashboard` export that shadows `pages/Dashboard.jsx` and creates a circular self-reference
- [ ] **FIX** `client/src/modules/projects/ProjectPage.jsx` — wire missing `onUpdateStatus` handler to `<ScreensTab>` (prop is accepted by tab but never passed from parent)
- [ ] **FIX** `client/src/pages/Attendance.jsx` — remove `fetchLeaveHistory` call from inside `loadData` useCallback; it is also called by a separate `useEffect` causing double-fetch on every filter change
- [ ] **FIX** `client/src/pages/Attendance.jsx` — fix leave duration calculation to count working days only (exclude Saturday/Sunday), not raw calendar days

---

## PRIORITY 2 — SECURITY FIXES

- [ ] **FIX** `client/src/pages/Careers.jsx` — install `dompurify`, wrap all ReactQuill HTML output with `DOMPurify.sanitize()` before rendering to prevent stored XSS
- [ ] **FIX** `client/src/pages/Users.jsx` — replace `Math.random()` password generator with `crypto.getRandomValues()` (cryptographically secure)
- [ ] **FIX** `client/src/apiConfig.js` — change hardcoded production URL fallback to `http://localhost:3000/api`; add a thrown error if `VITE_API_URL` is not set in the environment
- [ ] **FIX** `client/src/pages/ProjectPage.jsx` (legacy) — remove `projectId` and `title` from the DELETE document URL query string; backend should derive `projectId` from the document record using `docId` only
- [ ] **FIX** `client/src/pages/ProjectPage.jsx` (legacy) — replace `data:` URI attachment preview with `URL.createObjectURL(blob)` to prevent potential SVG/HTML XSS via attachment data URIs
- [ ] **FIX** `client/src/pages/Login.jsx` — add client-side brute-force guard: track failed attempts in state, disable submit button for 30 seconds after 5 consecutive failures

---

## PRIORITY 3 — LOGIC CORRECTIONS

- [ ] **FIX** `client/src/components/Sidebar.jsx` — fix `isActive` to use `startsWith` instead of exact match so nested routes like `/projects/123` correctly highlight the "Projects" nav item
- [ ] **FIX** `client/src/pages/MyTasks.jsx` — add external URL check before calling `navigate(row.actionUrl)`; if URL starts with `http`, use `window.location.href` instead
- [ ] **FIX** `client/src/pages/MyTasks.jsx` — replace silent `else groups.notifications.push(t)` catch-all with a dedicated "Other" group so unrecognised task categories are visible
- [ ] **FIX** `client/src/pages/Announcements.jsx` — add client-side filter to exclude announcements where `active === false` or `endDate` is in the past before rendering the card list
- [ ] **FIX** `client/src/pages/Attendance.jsx` — add validation on compensation leave form: `compensation_worked_date` must be in the past and must fall on a Saturday/Sunday or configured public holiday
- [ ] **FIX** `client/src/pages/Attendance.jsx` — change `compensation_worked_time` from a free-text `InputGroup` to a numeric input (hours, 1–12) with a unit label
- [ ] **FIX** `client/src/modules/projects/tabs/ActivityTab.jsx` — add pagination or a "load more" button; currently renders all activity records at once with no limit
- [ ] **FIX** `client/src/modules/projects/tabs/MilestonesTab.jsx` — replace free-text module input with a multi-select or checkbox list of actual project screens (port `handleToggleModule` logic from legacy `ProjectPage.jsx`)
- [ ] **FIX** `client/src/modules/projects/dialogs/BugDialog.jsx` — add a default placeholder option to the severity `Select` to handle cases where `editingBug.severity` is undefined
- [ ] **FIX** `client/src/components/FormComponents.jsx` — implement `as` prop in `InputGroup` so `as="textarea"` renders a `<textarea>` element; currently ignored and all descriptions render as single-line inputs

---

## PRIORITY 4 — MISSING FEATURES (core functionality)

- [ ] **ADD** `client/src/pages/Projects.jsx` — add search input that filters by project name and client name
- [ ] **ADD** `client/src/pages/Projects.jsx` — add delete project button (with `ConfirmDialog`) for admin role; call `DELETE /api/projects/:id`
- [ ] **ADD** `client/src/pages/Projects.jsx` — add start date and end date columns to the projects table
- [ ] **ADD** `client/src/pages/Users.jsx` — add search input that filters by name and email
- [ ] **ADD** `client/src/pages/Users.jsx` — add role filter dropdown next to search
- [ ] **ADD** `client/src/pages/Attendance.jsx` — add a leave balance summary card showing total entitlement vs. used vs. remaining for the logged-in employee
- [ ] **ADD** `client/src/pages/Attendance.jsx` — add a monthly calendar view (HR/Admin) showing which employees are on leave on each day
- [ ] **ADD** `client/src/pages/Attendance.jsx` — add holiday calendar configuration (Admin only) and warn employee when requested dates overlap with a public holiday
- [ ] **ADD** `client/src/pages/Notifications.jsx` — add per-item delete button to remove individual notifications
- [ ] **ADD** `client/src/pages/Notifications.jsx` — add a filter bar to show only a specific notification type (leave requests, project assignments, etc.)
- [ ] **ADD** `client/src/pages/MyTasks.jsx` — add priority sort and due-date sort within each task group
- [ ] **ADD** `client/src/pages/Careers.jsx` — create a public-facing job board page at `/careers/jobs` (no auth required) listing active job openings
- [ ] **ADD** `client/src/pages/Careers.jsx` — create a public application form page at `/careers/apply/:id` where external candidates can submit name, email, and resume upload
- [ ] **ADD** `client/src/pages/Careers.jsx` — add interview stage tracking fields to the application view: interview date, interviewer name, interview notes
- [ ] **ADD** `client/src/pages/Announcements.jsx` — add a rich-text editor (ReactQuill, already installed) to the announcement create/edit modal in place of the plain `<textarea>`
- [ ] **ADD** `client/src/pages/Announcements.jsx` — add a "pin" toggle so HR/Admin can pin critical announcements to the top of the list
- [ ] **ADD** `client/src/pages/Settings.jsx` — add a notification preferences section where users can enable/disable each notification type
- [ ] **ADD** `client/src/pages/Settings.jsx` — add a dark mode toggle that sets `data-theme="dark"` on `document.documentElement` and persists preference to `localStorage`

---

## PRIORITY 5 — PERFORMANCE IMPROVEMENTS

- [ ] **OPTIMIZE** `client/src/modules/projects/hooks/useProjectData.js` — combine `authFetch` and `.json()` calls into a single `Promise.all` so JSON parsing runs concurrently, not sequentially after all fetches resolve
- [ ] **OPTIMIZE** `client/src/pages/ProjectPage.jsx` (legacy) — convert `generateProjectSummary` from `useCallback` (returns a function) to `useMemo` (returns the string value directly)
- [ ] **OPTIMIZE** `client/src/pages/Attendance.jsx` — move year/month/search/status filtering for leave history to server-side query parameters instead of loading all records and filtering in memory
- [ ] **OPTIMIZE** `client/src/pages/ProjectPage.jsx` (legacy) — debounce or batch the `localStorage.setItem` call for bug filters; currently writes on every keystroke/change
- [ ] **OPTIMIZE** `client/src/components/Sidebar.jsx` — add a 60-second polling interval for task count so the badge stays fresh; clear the interval on unmount
- [ ] **OPTIMIZE** all `useEffect` data-fetching hooks across all pages — add `AbortController` and call `controller.abort()` in the cleanup function to prevent state updates on unmounted components

---

## PRIORITY 6 — CODE QUALITY & CLEANUP

- [ ] **REFACTOR** All pages using the "no changes detected" toast (`Projects.jsx`, `Users.jsx`, `Announcements.jsx`, `Careers.jsx`, `Settings.jsx`, `ProjectPage.jsx`) — import and use `noChangesToastConfig` from `client/src/utils/changeDetection.js` instead of duplicating the inline object
- [ ] **REFACTOR** `client/src/utils/formatters.js` — fix typo keys `'donr'`, `'apporved'`, `'aproval pending'` in `getStatusGradient`; these exist to compensate for bad data in the DB and should be fixed at the data layer
- [ ] **REFACTOR** `client/src/pages/Attendance.jsx` — split into `AttendanceAdmin.jsx` (team overview, approval queue, calendar) and `AttendanceEmployee.jsx` (personal history, request form); share a `<LeaveTable>` sub-component
- [ ] **REFACTOR** All dashboard components — replace the inline copy-pasted activity timeline JSX in `AdminDashboard`, `DeveloperDashboard`, `TesterDashboard`, `ManagementDashboard` with the shared `<ActivityTimeline>` component already defined in `common.jsx`
- [ ] **CLEANUP** `client/src/pages/ProjectPage.jsx` (legacy) — delete this file after confirming `client/src/modules/projects/ProjectPage.jsx` is the active import in `App.jsx`; having two implementations causes permanent confusion
- [ ] **CLEANUP** All files — remove all unguarded `console.info(...)` and `console.error(...)` calls (found in `Projects.jsx`, `Users.jsx`, `Announcements.jsx`, `Careers.jsx`, `Settings.jsx`, `ProjectPage.jsx`); either delete them or wrap with `if (import.meta.env.DEV)`
- [ ] **REFACTOR** `client/src/auth.js` — create a single centralized `401` interceptor so every page does not need its own `handleAuthError` / redirect-to-login logic
- [ ] **REFACTOR** `client/src/pages/Settings.jsx` — change profile picture upload to use `multipart/form-data` POST to a `/me/avatar` endpoint instead of embedding a base64 Data URI inside a JSON PATCH body

---

## PRIORITY 7 — NEW MODULES TO BUILD

- [ ] **BUILD** `client/src/pages/Reports.jsx` — a reports/analytics page for Admin/Management with: project completion rate over time, bug trend chart (real data), leave utilization by department, developer workload heatmap
- [ ] **BUILD** `client/src/pages/ECommerceProjects.jsx` — replace the Lottie placeholder with a real implementation mirroring the IT Projects module (project list, project detail with bugs/screens/milestones tabs)
- [ ] **BUILD** Holiday calendar admin panel — a settings sub-page where Admin can add/edit/delete public holidays used by the leave validation logic
- [ ] **BUILD** Notification preferences API + UI — backend table `notification_preferences(user_id, type, email_enabled, inapp_enabled)` with a Settings panel to manage it
- [ ] **BUILD** `client/src/context/TaskCountContext.jsx` — a React Context that exposes `taskCount` and `refreshTaskCount()`; replace the local state in `Sidebar.jsx` so any page can trigger a badge refresh after completing a task

---

## NOTES FOR AGENT

- All API calls must use `authFetch` from `client/src/auth.js`, never raw `fetch`
- All responses must go through `handleApiResponse` from `client/src/utils/errorHandler.js`
- All success/error messages must use `toast.success` / `toast.error` from `react-hot-toast`
- Delete confirmations must use `<ConfirmDialog>` from `FormComponents.jsx`, never `window.confirm()`
- All new pages must be wrapped in `<PageContainer>` and use `<PageLayout>` for consistent spacing
- New routes must be added to `client/src/App.jsx` with appropriate `<PrivateRoute roles={[...]}>` guards
- Tailwind classes must never be constructed dynamically from variables — use inline `style={{}}` or a static lookup object for dynamic colors
- Do not introduce new npm dependencies without checking if an equivalent utility already exists in the codebase
