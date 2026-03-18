const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
    getProjects,
    getBugs,
    getLeaves,
    getUsers,
    normalizeProjectObj
} = require('../middleware/helpers');

/**
 * GET /reports
 * @description Get analytics data for reports page
 */
router.get('/reports', authenticate, requireRole(['admin', 'management']), async (req, res) => {
    try {
        const [projects, bugs, leaves, users] = await Promise.all([
            getProjects(req),
            getBugs(req),
            getLeaves(req),
            getUsers(req)
        ]);

        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(d.toLocaleString('default', { month: 'short' }));
        }

        // 1. Project Completion Rate Over Time (last 6 months)
        // Mocking some trend data based on current project statuses
        const completionRate = {
            categories: months,
            series: [
                {
                    name: 'Completion Rate (%)',
                    data: [65, 68, 72, 75, 78, 82] // Mock trend
                }
            ]
        };

        // 2. Bug Trend (last 6 months)
        const bugCounts = months.map((month, index) => {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
            return bugs.filter(b => {
                const createdDate = new Date(b.createdAt);
                return createdDate.getMonth() === monthDate.getMonth() && 
                       createdDate.getFullYear() === monthDate.getFullYear();
            }).length;
        });

        const bugTrend = {
            categories: months,
            series: [
                {
                    name: 'New Bugs',
                    data: bugCounts
                }
            ]
        };

        // 3. Leave Utilization by Department
        // Assuming roles as departments for now
        const departments = ['Developer', 'Tester', 'Ecommerce', 'Admin', 'HR'];
        const leaveData = departments.map(dept => {
            return leaves.filter(l => l.userRole?.toLowerCase() === dept.toLowerCase()).length;
        });

        const leaveUtilization = {
            labels: departments,
            series: leaveData
        };

        // 4. Developer Workload Heatmap
        // Data format: { x: 'Day', y: 'Developer', v: 'Value' }
        const devs = users.filter(u => ['developer', 'ecommerce', 'tester'].includes(u.role)).slice(0, 10);
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        
        const workloadData = [];
        devs.forEach(dev => {
            days.forEach(day => {
                // Mock workload value between 0-10
                const val = Math.floor(Math.random() * 11);
                workloadData.push({ x: day, y: dev.name, v: val });
            });
        });

        const developerWorkload = {
            data: workloadData
        };

        res.json({
            completionRate,
            bugTrend,
            leaveUtilization,
            developerWorkload
        });

    } catch (error) {
        console.error('Error fetching report data:', error);
        res.status(500).json({ error: 'Failed to fetch report data' });
    }
});

module.exports = router;
