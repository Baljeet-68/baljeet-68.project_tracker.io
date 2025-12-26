// In-memory data store - Bug Tracker with roles: admin, tester, developer
// Data model per specification

const users = [
  { id: 'u1', name: 'Admin User', email: 'admin@example.com', password: 'admin123', role: 'admin', active: true },
  { id: 'u2', name: 'John', email: 'tester@example.com', password: 'tester123', role: 'tester', active: false },
  { id: 'u3', name: 'Dev Alice', email: 'alice@example.com', password: 'dev123', role: 'developer', active: true },
  { id: 'u4', name: 'Dev Bob', email: 'bob@example.com', password: 'dev123', role: 'developer', active: true },
  { id: 'u5', name: 'Dev Charlie', email: 'charlie@example.com', password: 'dev123', role: 'developer', active: true }
]

const projects = [
  {
    id: 'proj1',
    name: 'E-Commerce Platform',
    client: 'Acme Corp',
    description: 'Build scalable e-commerce platform',
    status: 'Running', // Under Planning, Running, On Hold, Completed, Critical
    testerId: 'u2', // One primary tester
    developerIds: ['u3', 'u4'], // Multiple developers
    createdBy: 'u1',
    createdAt: new Date('2025-01-01'),
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-06-01'),
    screens: [],
    bugs: [],
    activity: []
  },
  {
    id: 'proj2',
    name: 'Mobile App Redesign',
    client: 'TechStart Inc',
    description: 'Redesign mobile app UI/UX',
    status: 'Under Planning',
    testerId: 'u2',
    developerIds: ['u4', 'u5'],
    createdBy: 'u1',
    createdAt: new Date('2025-01-05'),
    startDate: new Date('2025-02-01'),
    endDate: new Date('2025-05-01'),
    screens: [],
    bugs: [],
    activity: []
  }
]

const screens = [
  {
    id: 'scr1',
    projectId: 'proj1',
    title: 'Product Listing Page',
    module: 'Frontend',
    assigneeId: 'u3',
    plannedDeadline: new Date('2025-02-15'),
    actualEndDate: null,
    status: 'In Progress', // Planned, In Progress, Blocked, Done
    notes: 'Include filtering and sorting',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10')
  },
  {
    id: 'scr2',
    projectId: 'proj1',
    title: 'Checkout Flow',
    module: 'Frontend',
    assigneeId: 'u4',
    plannedDeadline: new Date('2025-03-01'),
    actualEndDate: null,
    status: 'Planned',
    notes: 'Multi-step checkout',
    createdAt: new Date('2025-01-10'),
    updatedAt: new Date('2025-01-10')
  },
  {
    id: 'scr3',
    projectId: 'proj1',
    title: 'User Authentication',
    module: 'Backend',
    assigneeId: 'u3',
    plannedDeadline: new Date('2025-02-01'),
    actualEndDate: new Date('2025-01-28'),
    status: 'Done',
    notes: 'JWT-based auth',
    createdAt: new Date('2025-01-05'),
    updatedAt: new Date('2025-01-28')
  },
  {
    id: 'scr4',
    projectId: 'proj2',
    title: 'User Onboarding Flow',
    module: 'Frontend',
    assigneeId: 'u4',
    plannedDeadline: new Date('2025-03-10'),
    actualEndDate: null,
    status: 'Planned',
    notes: 'Initial user setup and tour',
    createdAt: new Date('2025-02-01'),
    updatedAt: new Date('2025-02-01')
  }
]

const bugs = [
  {
    id: 'bug1',
    projectId: 'proj1',
    bugNumber: 1, // Per-project auto-increment
    description: 'Filter dropdown not closing on selection',
    screenId: 'scr1',
    module: 'Frontend',
    assignedDeveloperId: 'u3',
    createdBy: 'u2',
    status: 'Open', // Open, In Progress, Resolved, Closed
    severity: 'high', // low, medium, high, critical
    attachments: [],
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
    resolvedAt: null
  },
  {
    id: 'bug2',
    projectId: 'proj1',
    bugNumber: 2,
    description: 'Sorting not working on mobile',
    screenId: 'scr1',
    module: 'Frontend',
    assignedDeveloperId: 'u4',
    createdBy: 'u2',
    status: 'In Progress',
    severity: 'medium',
    attachments: [],
    createdAt: new Date('2025-01-18'),
    updatedAt: new Date('2025-01-20'),
    resolvedAt: null
  },
  {
    id: 'bug3',
    projectId: 'proj1',
    bugNumber: 3,
    description: 'Payment gateway integration error',
    screenId: 'scr2',
    module: 'Backend',
    assignedDeveloperId: 'u4',
    createdBy: 'u2',
    status: 'Resolved',
    severity: 'critical',
    attachments: [],
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-22'),
    resolvedAt: new Date('2025-01-22')
  }
]

const activityLog = [
  {
    id: 'act1',
    projectId: 'proj1',
    entityType: 'bug',
    entityId: 'bug1',
    action: 'created',
    createdBy: 'u2',
    changes: { description: 'Filter dropdown not closing', status: 'Open' },
    createdAt: new Date('2025-01-15')
  },
  {
    id: 'act2',
    projectId: 'proj1',
    entityType: 'bug',
    entityId: 'bug2',
    action: 'status_change',
    createdBy: 'u4',
    changes: { oldStatus: 'Open', newStatus: 'In Progress' },
    createdAt: new Date('2025-01-20')
  }
]

// Per-project bug number counter
const bugCounters = {
  proj1: 3,
  proj2: 0
}

module.exports = { users, projects, screens, bugs, activityLog, bugCounters }
