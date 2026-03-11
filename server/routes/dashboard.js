/**
 * @file routes/dashboard.js
 * @description Dashboard summary API endpoint for aggregated system data
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
    getProjects,
    getBugs,
    getScreens,
    getLeaves,
    getNotifications,
    getUsers,
    getJobs,
    getApplications,
    getAnnouncements,
    getMilestones,
    getProjectDocuments,
    normalizeProjectObj
} = require('../middleware/helpers');

/**
 * GET /dashboard/summary
 * @description Get comprehensive dashboard summary with aggregated data
 */
router.get(`/dashboard/summary`, authenticate, async (req, res) => {
    try {
        const { role, userId } = req.user;

        // Fetch all data in parallel
        const [
            projects,
            bugs,
            screens,
            leaves,
            notifications,
            users,
            jobs,
            applications,
            announcements,
            milestones,
            projectDocuments
        ] = await Promise.all([
            getProjects(req),
            getBugs(req),
            getScreens(req),
            getLeaves(req),
            getNotifications(req, userId),
            getUsers(req),
            getJobs(req),
            getApplications(req),
            getAnnouncements(req),
            getMilestones(req),
            getProjectDocuments(req)
        ]);

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

        // Filter projects based on user role
        let accessibleProjects = projects;
        if (role !== 'admin') {
            accessibleProjects = projects.filter((p) => {
                const project = normalizeProjectObj(p);
                const isTester = (role === 'tester') && project.testerId === userId;
                const isDeveloper = (role === 'developer' || role === 'ecommerce') &&
                    project.developerIds && project.developerIds.includes(userId);
                return isTester || isDeveloper;
            });
        }

        // Filter bugs based on accessible projects
        const accessibleProjectIds = accessibleProjects.map(p => p.id);
        const accessibleBugs = bugs.filter(b => accessibleProjectIds.includes(b.projectId));
        const accessibleScreens = screens.filter(s => accessibleProjectIds.includes(s.projectId));

        // System Overview Metrics
        const systemOverview = {
            totalProjects: accessibleProjects.length,
            openBugs: accessibleBugs.filter(b => ['Open', 'In Progress'].includes(b.status)).length,
            totalScreens: accessibleScreens.length,
            activeUsers: users.filter(u => u.active).length,
            leavesToday: leaves.filter(l => {
                const startDate = new Date(l.start_date || l.createdAt).toISOString().split('T')[0];
                return startDate === today && ['Approved', 'Submitted'].includes(l.status);
            }).length,
            pendingTasks: 0, // Will be calculated from task service
            totalNotifications: notifications.filter(n => n.status === 'unread').length,
            activeJobs: jobs.filter(j => j.status === 'active').length,
            pendingApplications: applications.filter(a => a.status === 'pending').length
        };

        // My Work Summary
        const myWorkSummary = {
            myTasks: accessibleBugs.filter(b => b.assignedDeveloperId === userId && ['Open', 'In Progress'].includes(b.status)).length,
            assignedBugs: accessibleBugs.filter(b => b.assignedDeveloperId === userId).length,
            assignedScreens: accessibleScreens.filter(s => s.assigneeId === userId && s.status !== 'Done').length,
            pendingLeaveRequests: leaves.filter(l => l.user_id === userId && l.status === 'Submitted').length,
            myNotifications: notifications.filter(n => n.status === 'unread').length
        };

        // Bug Analytics
        const bugAnalytics = {
            byStatus: {
                open: accessibleBugs.filter(b => b.status === 'Open').length,
                inProgress: accessibleBugs.filter(b => b.status === 'In Progress').length,
                resolved: accessibleBugs.filter(b => b.status === 'Resolved').length,
                closed: accessibleBugs.filter(b => b.status === 'Closed').length
            },
            bySeverity: {
                critical: accessibleBugs.filter(b => b.severity === 'critical').length,
                high: accessibleBugs.filter(b => b.severity === 'high').length,
                medium: accessibleBugs.filter(b => b.severity === 'medium').length,
                low: accessibleBugs.filter(b => b.severity === 'low').length
            },
            trend: accessibleBugs.filter(b => new Date(b.createdAt) >= thirtyDaysAgo).length
        };

        // Project Health
        const projectHealth = {
            byStatus: {
                running: accessibleProjects.filter(p => ['Running', 'Active'].includes(p.status)).length,
                completed: accessibleProjects.filter(p => ['Completed', 'Done'].includes(p.status)).length,
                onHold: accessibleProjects.filter(p => p.status === 'On Hold').length,
                planning: accessibleProjects.filter(p => ['Planning', 'Under Planning'].includes(p.status)).length,
                critical: accessibleProjects.filter(p => p.status === 'Critical').length
            },
            topProjectsWithBugs: accessibleProjects
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    bugCount: accessibleBugs.filter(b => b.projectId === p.id).length,
                    openBugCount: accessibleBugs.filter(b => b.projectId === p.id && ['Open', 'In Progress'].includes(b.status)).length
                }))
                .sort((a, b) => b.bugCount - a.bugCount)
                .slice(0, 5)
        };

        // Developer Workload
        const developerWorkload = users
            .filter(u => ['developer', 'tester', 'ecommerce'].includes(u.role))
            .map(user => ({
                id: user.id,
                name: user.name,
                role: user.role,
                assignedBugs: accessibleBugs.filter(b => b.assignedDeveloperId === user.id).length,
                assignedScreens: accessibleScreens.filter(s => s.assigneeId === user.id && s.status !== 'Done').length,
                pendingTasks: 0 // Will be calculated from task service
            }))
            .sort((a, b) => (b.assignedBugs + b.assignedScreens) - (a.assignedBugs + a.assignedScreens));

        // Leave Overview
        const leaveOverview = {
            leavesToday: leaves.filter(l => {
                const startDate = new Date(l.start_date || l.createdAt).toISOString().split('T')[0];
                return startDate === today && ['Approved', 'Submitted'].includes(l.status);
            }).length,
            pendingRequests: leaves.filter(l => l.status === 'Submitted').length,
            leavesThisMonth: leaves.filter(l => {
                const leaveDate = new Date(l.start_date || l.createdAt);
                return leaveDate.getMonth() === now.getMonth() && leaveDate.getFullYear() === now.getFullYear();
            }).length
        };

        // Recent Activity
        const recentActivity = [
            ...bugs.slice(-10).map(bug => ({
                id: bug.id,
                type: 'bug',
                action: 'created',
                description: `Bug #${bug.bugNumber} created in ${bug.projectName || 'Project'}`,
                timestamp: bug.createdAt,
                user: bug.createdByName
            })),
            ...screens.slice(-10).map(screen => ({
                id: screen.id,
                type: 'screen',
                action: 'created',
                description: `Screen "${screen.title}" created`,
                timestamp: screen.createdAt,
                user: screen.assigneeName
            })),
            ...leaves.slice(-10).map(leave => ({
                id: leave.id,
                type: 'leave',
                action: 'submitted',
                description: `${leave.userName} submitted a ${leave.type} request`,
                timestamp: leave.created_at || leave.createdAt,
                user: leave.userName
            }))
        ]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);

        res.json({
            systemOverview,
            myWorkSummary,
            bugAnalytics,
            projectHealth,
            developerWorkload,
            leaveOverview,
            recentActivity,
            userRole: role
        });

    } catch (error) {
        console.error('Error in GET /dashboard/summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;