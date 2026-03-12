# Project Page Refactor - Component API Reference

## Table of Contents
1. [Main Components](#main-components)
2. [Tab Components](#tab-components)
3. [Dialog Components](#dialog-components)
4. [Hooks](#hooks)
5. [Utilities](#utilities)
6. [Props Interface Definitions](#props-interface-definitions)

---

## Main Components

### ProjectPage

**Purpose**: Main orchestrator component. Manages tab state, dialog visibility, and data flow.

**Location**: `src/modules/projects/ProjectPage.jsx`

**Props**:
```typescript
{
  projectId: string | number  // From URL params
}
```

**State**:
```typescript
{
  activeTab: 'overview' | 'screens' | 'milestones' | 'tasks' | 'bugs' | 'documents' | 'activity',
  // Dialog states
  bugDialogOpen: boolean,
  screenDialogOpen: boolean,
  milestoneDialogOpen: boolean,
  documentDialogOpen: boolean,
  // Edit mode
  editingBug: object | null,
  editingScreen: object | null,
  editingMilestone: object | null
}
```

**Event Handlers**:
```javascript
// Tab switching
handleTabChange(tabKey)

// Bug operations
handleOpenBugDialog(bug?: Bug)
handleCloseBugDialog()
handleSubmitBug(formData: BugFormData)

// Screen operations
handleOpenScreenDialog(screen?: Screen)
handleCloseScreenDialog()
handleSubmitScreen(formData: ScreenFormData)

// Milestone operations
handleOpenMilestoneDialog(milestone?: Milestone)
handleCloseMilestoneDialog()
handleSubmitMilestone(formData: MilestoneFormData)

// Document operations
handleOpenDocumentDialog()
handleCloseDocumentDialog()
handleUploadDocument(file: File, metadata: DocumentMetadata)

// Refresh
handleRefreshData()
```

**Returns**:
```jsx
<div className="project-page">
  <ProjectHeader data={project} stats={{...}} />
  <TabNavigation activeTab={activeTab} onChange={handleTabChange} />
  {/* Active tab content */}
  {/* All dialogs */}
</div>
```

---

### ProjectHeader

**Purpose**: Displays project overview with statistics and progress.

**Location**: `src/modules/projects/ProjectHeader.jsx`

**Props**:
```typescript
{
  project: Project,
  stats: {
    totalScreens: number,
    completedScreens: number,
    openBugs: number,
    upcomingDeadlines: number
  },
  progress: number // 0-100
}
```

**Displays**:
- Project name & client
- Status badge (color-coded)
- Progress bar with percentage
- 4 stat cards with icons
- Refresh button

**Example**:
```jsx
<ProjectHeader 
  project={projectData}
  stats={{
    totalScreens: 5,
    completedScreens: 3,
    openBugs: 12,
    upcomingDeadlines: 2
  }}
  progress={60}
/>
```

---

## Tab Components

All tab components follow the same interface:

**Common Props Pattern**:
```typescript
TabComponent.propTypes = {
  data: DataType,              // Specific to tab
  loading: boolean,
  error: Error | null,
  onAction: function,          // Action callback
  onRefresh: function           // Refresh data
}
```

---

### OverviewTab

**Purpose**: Display project summary, team, timeline, and statistics.

**Props**:
```typescript
{
  project: Project,
  screens: Screen[],
  milestones: Milestone[],
  tasks: Task[],
  bugs: Bug[],
  loading: boolean,
  error: Error | null,
  onEditProject?: (data) => void
}
```

**Displays**:
- Project summary (description, client, dates)
- Team members (avatar, role, contact)
- Development timeline
- Recent milestones preview
- Key statistics

**Example**:
```jsx
<OverviewTab 
  project={projectData}
  screens={screensList}
  milestones={milestonesList}
  tasks={tasksList}
  bugs={bugsList}
  loading={isLoading}
  error={error}
/>
```

---

### ScreensTab

**Purpose**: Manage project screens/modules.

**Props**:
```typescript
{
  screens: Screen[],
  loading: boolean,
  error: Error | null,
  onAdd: (formData: ScreenFormData) => Promise<Screen>,
  onEdit: (id: string, formData: ScreenFormData) => Promise<Screen>,
  onDelete: (id: string) => Promise<void>,
  onOpenEditDialog: (screen: Screen) => void,
  onOpenNewDialog: () => void
}
```

**Screen Model**:
```typescript
{
  id: string,
  projectId: string,
  title: string,
  description: string,
  screenType: 'UI' | 'API' | 'Database' | 'Integration',
  status: 'Not Started' | 'In Progress' | 'Review' | 'Done',
  assignedTo: User,
  tasks: Task[],
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Displays**:
- List of screens in table
- Create button
- Edit/Delete actions
- Status and assignment info
- Task count per screen

**Example**:
```jsx
<ScreensTab 
  screens={screensData}
  loading={isLoading}
  error={error}
  onOpenNewDialog={() => setScreenDialogOpen(true)}
  onOpenEditDialog={(screen) => {
    setEditingScreen(screen);
    setScreenDialogOpen(true);
  }}
/>
```

---

### MilestonesTab

**Purpose**: Manage project milestones and timeline tracking.

**Props**:
```typescript
{
  milestones: Milestone[],
  loading: boolean,
  error: Error | null,
  onAdd: (formData: MilestoneFormData) => Promise<Milestone>,
  onEdit: (id: string, formData: MilestoneFormData) => Promise<Milestone>,
  onDelete: (id: string) => Promise<void>,
  onOpenEditDialog: (milestone: Milestone) => void,
  onOpenNewDialog: () => void
}
```

**Milestone Model**:
```typescript
{
  id: string,
  projectId: string,
  milestoneNumber: number,
  title: string,
  description: string,
  startDate: Date,
  dueDate: Date,
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed',
  completionPercentage: number,
  tasks: Task[],
  createdAt: Date,
  updatedAt: Date
}
```

**Displays**:
- Milestone timeline view
- Status indicators
- Completion percentage
- Create/Edit/Delete actions
- Associated tasks count

**Example**:
```jsx
<MilestonesTab 
  milestones={milestonesData}
  loading={isLoading}
  error={error}
  onOpenNewDialog={() => setMilestoneDialogOpen(true)}
/>
```

---

### TasksTab

**Purpose**: Display and manage all project tasks.

**Props**:
```typescript
{
  tasks: Task[],
  loading: boolean,
  error: Error | null,
  onStatusChange?: (taskId: string, newStatus: string) => Promise<void>,
  onPriorityChange?: (taskId: string, newPriority: string) => Promise<void>
}
```

**Task Model**:
```typescript
{
  id: string,
  projectId: string,
  screenId: string,
  screenTitle: string,
  title: string,
  description: string,
  status: 'To Do' | 'In Progress' | 'Review' | 'Done',
  priority: 'Low' | 'Medium' | 'High' | 'Critical',
  assignedTo: User,
  dueDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Displays**:
- All project tasks in table or kanban
- Sort by priority (High → Low)
- Status badges
- Developer assignment
- Due date indicators
- Click to edit

**Example**:
```jsx
<TasksTab 
  tasks={tasksData}
  loading={isLoading}
  error={error}
  onStatusChange={handleTaskStatusChange}
/>
```

---

### BugsTab

**Purpose**: Track and manage project bugs/issues.

**Props**:
```typescript
{
  bugs: Bug[],
  loading: boolean,
  error: Error | null,
  onAdd: (formData: BugFormData) => Promise<Bug>,
  onEdit: (id: string, formData: BugFormData) => Promise<Bug>,
  onDelete: (id: string) => Promise<void>,
  onStatusChange: (id: string, newStatus: string) => Promise<void>,
  onSeverityChange: (id: string, newSeverity: string) => Promise<void>,
  onOpenEditDialog: (bug: Bug) => void,
  onOpenNewDialog: () => void
}
```

**Bug Model**:
```typescript
{
  id: string,
  projectId: string,
  title: string,
  description: string,
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | 'Reopened',
  severity: 'Low' | 'Medium' | 'High' | 'Critical',
  priority: 'Low' | 'Medium' | 'High' | 'Critical',
  assignedTo: User,
  reportedBy: User,
  dueDate: Date,
  resolvedAt: Date | null,
  attachments: Attachment[],
  createdAt: Date,
  updatedAt: Date
}
```

**Displays**:
- Bug list with filters
- Status and severity badges
- Developer assignment
- Filter by severity, status, priority
- Create, Edit, Delete actions
- Quick status update
- Deadline inline edit

**Example**:
```jsx
<BugsTab 
  bugs={bugsData}
  loading={isLoading}
  error={error}
  onOpenNewDialog={() => setBugDialogOpen(true)}
  onStatusChange={handleStatusUpdate}
/>
```

---

### DocumentsTab

**Purpose**: Upload, download, and manage project documents.

**Props**:
```typescript
{
  documents: ProjectDocument[],
  loading: boolean,
  error: Error | null,
  onUpload: (file: File, metadata: DocumentMetadata) => Promise<ProjectDocument>,
  onDelete: (id: string) => Promise<void>,
  onOpenUploadDialog: () => void
}
```

**Document Model**:
```typescript
{
  id: string,
  projectId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  title: string,
  description: string,
  uploadedBy: User,
  filePath: string,
  previewUrl: string | null,
  category: 'Specification' | 'Design' | 'Contract' | 'Other',
  createdAt: Date,
  updatedAt: Date
}
```

**Displays**:
- Document list with file info
- Upload button
- Download links
- File preview (images)
- Delete action
- Sort by date, size, type
- Search functionality

**Example**:
```jsx
<DocumentsTab 
  documents={documentsData}
  loading={isLoading}
  error={error}
  onOpenUploadDialog={() => setDocumentDialogOpen(true)}
/>
```

---

### ActivityTab

**Purpose**: Display project audit log and activity timeline.

**Props**:
```typescript
{
  activities: ProjectActivity[],
  loading: boolean,
  error: Error | null,
  onLoadMore?: () => Promise<void>
}
```

**Activity Model**:
```typescript
{
  id: string,
  projectId: string,
  userId: string,
  userName: string,
  userEmail: string,
  action: string,  // 'Created', 'Updated', 'Deleted', 'Status Changed', etc
  entityType: string,  // 'Bug', 'Screen', 'Milestone', 'Task', 'Document'
  entityId: string,
  entityTitle: string,
  changes: {
    field: string,
    oldValue: any,
    newValue: any
  }[],
  description: string,  // Human-readable summary
  ipAddress: string,
  userAgent: string,
  timestamp: Date
}
```

**Displays**:
- Timeline of all activities
- Reverse chronological order
- Activity icons by type
- User and timestamp info
- Change details (what changed)
- Pagination or infinite scroll
- Filter by entity type or user

**Example**:
```jsx
<ActivityTab 
  activities={activityData}
  loading={isLoading}
  error={error}
/>
```

---

## Dialog Components

All dialogs follow the same visibility pattern:

```typescript
{
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (formData) => Promise<void>,
  initialData?: object,  // For edit mode
  options?: object       // Dropdowns, lists
}
```

---

### BugDialog

**Purpose**: Create or edit bug reports.

**Props**:
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (formData: BugFormData) => Promise<void>,
  initialData?: Bug,  // For edit mode
  teamMembers: User[],
  severities: string[],  // ['Low', 'Medium', 'High', 'Critical']
  statuses: string[]     // ['Open', 'In Progress', 'Resolved', 'Closed']
}
```

**Form Data**:
```typescript
{
  title: string,           // Required
  description: string,     // Required
  severity: string,        // Required
  priority: string,        // Optional
  assignedToId: string,    // Optional
  dueDate: Date,           // Optional
  attachments: File[]      // Optional
}
```

**Form Fields**:
- Title (text input, required)
- Description (textarea, required)
- Severity (dropdown, required)
- Priority (dropdown, optional)
- Assigned To (user select, optional)
- Due Date (date picker, optional)
- Attachments (file upload, optional)

**Example**:
```jsx
<BugDialog
  isOpen={bugDialogOpen}
  onClose={handleCloseBugDialog}
  onSubmit={handleSubmitBug}
  initialData={editingBug}  // null for create mode
  teamMembers={project.teamMembers}
  severities={BUG_SEVERITIES}
  statuses={BUG_STATUSES}
/>
```

---

### ScreenDialog

**Purpose**: Create or edit project screens.

**Props**:
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (formData: ScreenFormData) => Promise<void>,
  initialData?: Screen,
  teamMembers: User[],
  screenTypes: string[]  // ['UI', 'API', 'Database', 'Integration']
}
```

**Form Data**:
```typescript
{
  title: string,           // Required
  description: string,     // Optional
  screenType: string,      // Required
  assignedToId: string,    // Optional
  dueDate: Date            // Optional
}
```

**Example**:
```jsx
<ScreenDialog
  isOpen={screenDialogOpen}
  onClose={handleCloseScreenDialog}
  onSubmit={handleSubmitScreen}
  initialData={editingScreen}
  teamMembers={project.teamMembers}
  screenTypes={SCREEN_TYPES}
/>
```

---

### MilestoneDialog

**Purpose**: Create or edit milestones.

**Props**:
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (formData: MilestoneFormData) => Promise<void>,
  initialData?: Milestone
}
```

**Form Data**:
```typescript
{
  milestoneNumber: number,  // Required
  title: string,            // Required
  description: string,      // Optional
  startDate: Date,          // Required
  dueDate: Date,            // Required
  status: string            // Optional
}
```

**Example**:
```jsx
<MilestoneDialog
  isOpen={milestoneDialogOpen}
  onClose={handleCloseMilestoneDialog}
  onSubmit={handleSubmitMilestone}
  initialData={editingMilestone}
/>
```

---

### DocumentDialog

**Purpose**: Upload project documents.

**Props**:
```typescript
{
  isOpen: boolean,
  onClose: () => void,
  onSubmit: (formData: DocumentFormData) => Promise<void>,
  maxFileSize: number  // bytes, default 25MB
}
```

**Form Data**:
```typescript
{
  title: string,        // Required
  description: string,  // Optional
  category: string,     // Optional
  file: File            // Required
}
```

**Validation**:
- File required
- File size < 25MB
- Allowed types: pdf, doc, docx, xls, xlsx, ppt, pptx, zip, txt, jpg, png

**Example**:
```jsx
<DocumentDialog
  isOpen={documentDialogOpen}
  onClose={handleCloseDocumentDialog}
  onSubmit={handleUploadDocument}
  maxFileSize={26214400}  // 25MB
/>
```

---

## Hooks

### useProjectData

**Purpose**: Centralized hook for fetching all project-related data.

**Location**: `src/modules/projects/hooks/useProjectData.js`

**Usage**:
```javascript
const {
  project,
  screens,
  bugs,
  milestones,
  documents,
  activity,
  tasks,
  loading,
  error,
  refetch
} = useProjectData(projectId)
```

**Returns**:
```typescript
{
  project: Project | null,
  screens: Screen[],
  bugs: Bug[],
  milestones: Milestone[],
  documents: ProjectDocument[],
  activity: ProjectActivity[],
  tasks: Task[],
  loading: boolean,
  error: Error | null,
  refetch: () => Promise<void>
}
```

**API Calls** (in parallel):
1. `GET /api/projects/{projectId}` → project
2. `GET /api/screens?projectId={projectId}` → screens
3. `GET /api/bugs?projectId={projectId}` → bugs
4. `GET /api/milestones?projectId={projectId}` → milestones
5. `GET /api/projectDocuments?projectId={projectId}` → documents
6. `GET /api/projects/{projectId}/activity` → activity
7. `GET /api/tasks/project/{projectId}` → tasks

**Error Handling**:
- Returns error state if any request fails
- Retry logic on network errors
- Token refresh on 401

**Caching**:
- Caches results per component mount
- `refetch()` clears cache and re-fetches

**Example**:
```jsx
const ProjectPage = ({ projectId }) => {
  const {
    project,
    bugs,
    loading,
    error,
    refetch
  } = useProjectData(projectId)

  if (loading) return <Spinner />
  if (error) return <ErrorAlert error={error} onRetry={refetch} />

  return (
    <div>
      <ProjectHeader project={project} />
      <BugsTab bugs={bugs} />
    </div>
  )
}
```

---

## Utilities

### formatters.js

**Location**: `src/modules/projects/utils/formatters.js`

#### formatDateDisplay(date: Date | string): string
Formats date for display (e.g., "12 Mar 2026")
```javascript
formatDateDisplay(new Date('2026-03-12'))  // "12 Mar 2026"
```

#### formatFileSize(bytes: number): string
Converts bytes to human-readable format
```javascript
formatFileSize(1048576)  // "1 MB"
formatFileSize(1024)     // "1 KB"
```

#### getStatusGradient(status: string): string
Returns TailwindCSS gradient class for status
```javascript
getStatusGradient('Done')        // "from-green-400 to-green-600"
getStatusGradient('In Progress') // "from-blue-400 to-blue-600"
```

#### getSeverityGradient(severity: string): string
Returns gradient for bug severity
```javascript
getSeverityGradient('Critical')  // "from-red-400 to-red-600"
getSeverityGradient('Low')       // "from-green-400 to-green-600"
```

#### calculateProjectProgress(screens: Screen[]): number
Calculates completion percentage
```javascript
const progress = calculateProjectProgress(screensData)  // 0-100
```

---

### constants.js

**Location**: `src/modules/projects/utils/constants.js`

```javascript
export const PROJECT_STATUSES = [
  'Planning',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled'
]

export const SCREEN_STATUSES = [
  'Not Started',
  'In Progress',
  'Review',
  'Done'
]

export const SCREEN_TYPES = [
  'UI',
  'API',
  'Database',
  'Integration'
]

export const BUG_STATUSES = [
  'Open',
  'In Progress',
  'Resolved',
  'Closed',
  'Reopened'
]

export const BUG_SEVERITIES = [
  'Low',
  'Medium',
  'High',
  'Critical'
]

export const PRIORITY_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Critical'
]

export const TABS = {
  OVERVIEW: 'overview',
  SCREENS: 'screens',
  MILESTONES: 'milestones',
  TASKS: 'tasks',
  BUGS: 'bugs',
  DOCUMENTS: 'documents',
  ACTIVITY: 'activity'
}

export const TAB_LIST = [
  { key: 'overview', label: 'Overview', icon: 'Home' },
  { key: 'screens', label: 'Screens', icon: 'Layout' },
  { key: 'milestones', label: 'Milestones', icon: 'Flag' },
  { key: 'tasks', label: 'Tasks', icon: 'CheckSquare' },
  { key: 'bugs', label: 'Bugs', icon: 'AlertCircle' },
  { key: 'documents', label: 'Documents', icon: 'FileText' },
  { key: 'activity', label: 'Activity', icon: 'History' }
]
```

---

## Props Interface Definitions

### Common Types

```typescript
// User
interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

// Project
interface Project {
  id: string
  name: string
  description: string
  clientName: string
  status: string
  progress: number
  startDate: Date
  endDate: Date
  budget: number
  teamLeadId: string
  teamMembers: User[]
  createdBy: User
  createdAt: Date
  updatedAt: Date
}

// Screen
interface Screen {
  id: string
  projectId: string
  title: string
  description: string
  screenType: string
  status: string
  assignedToId: string
  assignedTo: User
  tasks: Task[]
  dueDate: Date
  createdAt: Date
  updatedAt: Date
}

// Bug
interface Bug {
  id: string
  projectId: string
  title: string
  description: string
  status: string
  severity: string
  priority: string
  assignedToId: string
  assignedTo: User
  reportedById: string
  reportedBy: User
  dueDate: Date
  resolvedAt: Date | null
  attachments: Attachment[]
  createdAt: Date
  updatedAt: Date
}

// Milestone
interface Milestone {
  id: string
  projectId: string
  milestoneNumber: number
  title: string
  description: string
  startDate: Date
  dueDate: Date
  status: string
  completionPercentage: number
  tasks: Task[]
  createdAt: Date
  updatedAt: Date
}

// Task
interface Task {
  id: string
  projectId: string
  screenId: string
  title: string
  description: string
  status: string
  priority: string
  assignedToId: string
  dueDate: Date
  milestoneId: string
  createdAt: Date
  updatedAt: Date
}

// Document
interface ProjectDocument {
  id: string
  projectId: string
  fileName: string
  fileSize: number
  fileType: string
  title: string
  description: string
  uploadedById: string
  uploadedBy: User
  filePath: string
  previewUrl: string | null
  category: string
  createdAt: Date
  updatedAt: Date
}

// Activity
interface ProjectActivity {
  id: string
  projectId: string
  userId: string
  userName: string
  userEmail: string
  action: string
  entityType: string
  entityId: string
  entityTitle: string
  changes: Change[]
  description: string
  ipAddress: string
  userAgent: string
  timestamp: Date
}

// Change
interface Change {
  field: string
  oldValue: any
  newValue: any
}

// Attachment
interface Attachment {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  fileType: string
  uploadedAt: Date
}
```

---

## Integration Checklist

### Before Using Components

- [ ] All API endpoints responding
- [ ] Backend project route implemented
- [ ] Authentication token available
- [ ] React Router configured
- [ ] TailwindCSS available
- [ ] Custom UI components imported

### Component Integration Steps

1. Import ProjectPage from new location
2. Pass projectId from URL params
3. Verify all API routes match backend
4. Test data loading with network tab open
5. Check error boundaries working
6. Verify token refresh on 401

---

**Version**: 1.0  
**Last Updated**: 2026-03-12  
**Audience**: Frontend Developers, QA Engineers, Project Leads
