const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getLeaves } = require('../middleware/helpers');

// Helper to check if a user is Admin or HR
const isAdminOrHR = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'hr') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied' });
  }
};

// Get all leaves (filtered by role and visibility)
router.get(`/leaves`, authenticate, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const allLeaves = await getLeaves(req);
    let result = [];

    if (role === 'admin') {
      result = allLeaves;
    } else if (role === 'hr') {
      // HR sees their own + what's pending for them (Tester, Developer, E-commerce)
      // For now, returning all for HR too as per original code's commented intent or UI filtering
      result = allLeaves;
    } else {
      // Regular users only see their own
      result = allLeaves.filter(l => l.user_id === userId);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// Submit a leave request
router.post(`/leaves`, authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    
    // Admin cannot request leaves
    if (role === 'admin') {
      return res.status(403).json({ error: 'Admins are not allowed to submit leave requests.' });
    }

    const { 
      type, 
      start_date, 
      end_date, 
      half_day_period, 
      short_leave_time, 
      compensation_worked_date, 
      compensation_worked_time,
      reason,
      is_emergency
    } = req.body;

    // Determine approver and initial status based on new matrix
    let approver_role = 'hr';
    let status = 'Submitted';

    if (role === 'hr') {
      approver_role = 'admin';
    } else if (['management', 'accountant'].includes(role.toLowerCase())) {
      // Management/Accountant can be approved by HR or Admin
      // For notification purposes, we'll notify both or pick one. 
      // Based on logic below, we'll set a flag or handle it in the notification block.
      approver_role = 'hr_or_admin'; 
    } else {
      // Developer, Tester, Ecommerce
      approver_role = 'hr';
    }

    // Rules Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(start_date);
    startDate.setHours(0, 0, 0, 0);

    // 0. Past date check (except Compensation)
    if (type !== 'Compensation' && startDate < today) {
      return res.status(400).json({ error: 'Leave request cannot be for a past date' });
    }

    // 0.1 3-day rule for Paid/Full leaves
    if (!is_emergency && (type === 'Paid Leave' || type === 'Full Day')) {
      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(today.getDate() + 3);
      if (startDate < threeDaysFromNow) {
        return res.status(400).json({ error: 'Paid/Full Day leaves must be requested 3 days in advance' });
      }
    }

    // Find an approver id for the record (optional, since we use role-based queues)
    let approver_id = null;
    if (approver_role !== 'hr_or_admin') {
      const [approvers] = await pool.query('SELECT id FROM users WHERE role = ? LIMIT 1', [approver_role]);
      approver_id = approvers.length > 0 ? approvers[0].id : null;
    } else {
      // For hr_or_admin, we'll just leave it null or pick the first HR
      const [approvers] = await pool.query('SELECT id FROM users WHERE role = "hr" LIMIT 1');
      approver_id = approvers.length > 0 ? approvers[0].id : null;
    }

    // Rules Validation
    const monthStart = new Date(start_date);
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    // 1. Max 2 short leaves per month
    if (type === 'Short Leave' || type === 'Early Leave') {
      const [shortLeaves] = await pool.query(
        'SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND type IN ("Short Leave", "Early Leave") AND start_date BETWEEN ? AND ? AND status != "Rejected"',
        [userId, monthStart, monthEnd]
      );
      if (shortLeaves[0].count >= 2) {
        // Warning logic handled by UI or just return warning info
        // Requirement: "third give warning" -> we allow but warn
      }
    }

    // 2. Max 1 paid leave per month
    if (type === 'Paid Leave') {
      const [paidLeaves] = await pool.query(
        'SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND type = "Paid Leave" AND start_date BETWEEN ? AND ? AND status NOT IN ("Rejected", "Cancelled")',
        [userId, monthStart, monthEnd]
      );
      if (paidLeaves[0].count >= 1) {
        return res.status(400).json({ error: 'Maximum 1 paid leave per month allowed' });
      }
    }

    // 5. No overlapping or duplicate leave dates
    const [overlap] = await pool.query(
      'SELECT id FROM leaves WHERE user_id = ? AND status NOT IN ("Rejected", "Cancelled") AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))',
      [userId, end_date || start_date, start_date, end_date || start_date, start_date]
    );
    if (overlap.length > 0) {
      return res.status(400).json({ error: 'Leave request overlaps with an existing leave' });
    }

    const sql = `INSERT INTO leaves 
      (user_id, type, status, start_date, end_date, half_day_period, short_leave_time, compensation_worked_date, compensation_worked_time, reason, approver_id, is_emergency) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const [inserted] = await pool.execute(sql, [
      userId, type, status, start_date, end_date || start_date, half_day_period, short_leave_time, compensation_worked_date, compensation_worked_time, reason, approver_id, is_emergency ? 1 : 0
    ]);

    // Create Notifications for HR or Admin
    if (status === 'Submitted') {
      const [user] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
      const userName = user[0]?.name || 'Someone';
      
      let notifyRoles = [];
      if (role === 'hr') {
        notifyRoles = ['admin'];
      } else if (['management', 'accountant'].includes(role.toLowerCase())) {
        notifyRoles = ['hr', 'admin'];
      } else {
        notifyRoles = ['hr'];
      }

      const [targetUsers] = await pool.query('SELECT id FROM users WHERE role IN (?)', [notifyRoles]);
      
      // Format date for notification
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' };
      const formattedStartDate = new Date(start_date).toLocaleDateString('en-IN', dateOptions);
      const formattedEndDate = end_date ? new Date(end_date).toLocaleDateString('en-IN', dateOptions) : null;
      const dateDisplay = formattedEndDate && formattedEndDate !== formattedStartDate 
        ? `${formattedStartDate} to ${formattedEndDate}`
        : formattedStartDate;

      const halfDayInfo = type === 'Half Day' ? ` (${half_day_period})` : '';
      
      for (const targetUser of targetUsers) {
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, category) VALUES (?, ?, ?, ?, ?)',
          [
            targetUser.id, 
            'leave_request', 
            'New Leave Request', 
            `${userName} has submitted a ${type} request for ${dateDisplay}${halfDayInfo}.`,
            'HR'
          ]
        );
      }
    }

    res.json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Error submitting leave:', error);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// Approve/Reject leave
router.patch(`/leaves/:id/status`, authenticate, isAdminOrHR, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'Approved' or 'Rejected'
    const { userId, role } = req.user;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if the user is authorized to approve this leave
    const [leave] = await pool.query('SELECT l.*, u.role as userRole FROM leaves l JOIN users u ON l.user_id = u.id WHERE l.id = ?', [id]);
    if (leave.length === 0) return res.status(404).json({ error: 'Leave not found' });

    const targetUserRole = leave[0].userRole.toLowerCase();
    let canApprove = false;

    if (role === 'admin') {
      // Admin approves HR, Management, Accountant, and also Developer, Tester, Ecommerce
      // Basically Admin can approve everything except their own (but they can't request anyway)
      canApprove = true; 
    } else if (role === 'hr') {
      // HR approves Tester, Developer, E-commerce, Management, Accountant
      if (['tester', 'developer', 'ecommerce', 'management', 'accountant'].includes(targetUserRole)) {
        canApprove = true;
      }
    }

    if (!canApprove) {
      return res.status(403).json({ error: 'You are not authorized to approve this leave request' });
    }

    await pool.execute('UPDATE leaves SET status = ?, approver_id = ? WHERE id = ?', [status, userId, id]);
    
    // Notify the user about approval/rejection
    const [leaveInfo] = await pool.query('SELECT user_id, type, start_date, half_day_period FROM leaves WHERE id = ?', [id]);
    if (leaveInfo.length > 0) {
      const { type, start_date, half_day_period } = leaveInfo[0];
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' };
      const formattedDate = new Date(start_date).toLocaleDateString('en-IN', dateOptions);
      const halfDayInfo = type === 'Half Day' ? ` (${half_day_period})` : '';

      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, category) VALUES (?, ?, ?, ?, ?)',
        [
          leaveInfo[0].user_id,
          'leave_status',
          `Leave Request ${status}`,
          `Your ${type} request for ${formattedDate}${halfDayInfo} has been ${status.toLowerCase()}.`,
          'HR'
        ]
      );
    }
    
    res.json({ message: `Leave ${status.toLowerCase()} successfully` });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ error: 'Failed to update leave status' });
  }
});

// Cancel leave (only before approval)
router.patch(`/leaves/:id/cancel`, authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const [leave] = await pool.query('SELECT * FROM leaves WHERE id = ? AND user_id = ?', [id, userId]);
    if (leave.length === 0) return res.status(404).json({ error: 'Leave not found' });

    if (leave[0].status !== 'Submitted' && leave[0].status !== 'Pending Approval') {
      return res.status(400).json({ error: 'Only pending leaves can be cancelled' });
    }

    await pool.execute('UPDATE leaves SET status = "Cancelled" WHERE id = ?', [id]);

    // Notify HR or Admin about cancellation
    const [user] = await pool.query('SELECT name, role FROM users WHERE id = ?', [userId]);
    const userName = user[0]?.name || 'Someone';
    const userRole = user[0]?.role || '';

    let notifyRole = 'hr';
    if (['hr', 'management', 'accountant'].includes(userRole.toLowerCase())) {
      notifyRole = 'admin';
    }

    const [targetUsers] = await pool.query('SELECT id FROM users WHERE role = ?', [notifyRole]);
    
    for (const targetUser of targetUsers) {
      const { type, start_date, half_day_period } = leave[0];
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' };
      const formattedDate = new Date(start_date).toLocaleDateString('en-IN', dateOptions);
      const halfDayInfo = type === 'Half Day' ? ` (${half_day_period})` : '';

      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, category) VALUES (?, ?, ?, ?, ?)',
        [
          targetUser.id, 
          'leave_cancelled', 
          'Leave Request Cancelled', 
          `${userName} has cancelled their ${type} request for ${formattedDate}${halfDayInfo}.`,
          'HR'
        ]
      );
    }

    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({ error: 'Failed to cancel leave' });
  }
});

// Stats for dashboard
router.get(`/leaves/stats/summary`, authenticate, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const { role, userId } = req.user;
    const allLeaves = await getLeaves(req);
    const monthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM

    // 1. On leave today (Full Day / Paid Leave / Compensation)
    const onLeaveToday = allLeaves.filter(l => 
      l.status === 'Approved' && 
      todayStr >= l.start_date.toISOString().split('T')[0] && 
      todayStr <= l.end_date.toISOString().split('T')[0] &&
      ["Full Day", "Paid Leave", "Compensation"].includes(l.type)
    ).length;

    // 2. On halfday today
    const onHalfDayToday = allLeaves.filter(l => 
      l.status === 'Approved' && 
      todayStr >= l.start_date.toISOString().split('T')[0] && 
      todayStr <= l.end_date.toISOString().split('T')[0] &&
      l.type === "Half Day"
    ).length;

    // 3. Pending requests (for HR or Admin based on matrix)
    const pendingRequests = (role === 'admin' || role === 'hr') 
      ? allLeaves.filter(l => l.status === 'Submitted').length 
      : 0;

    // 4. Specifically for Admin: Pending from HR/Management/Accountant
    const adminPendingRequests = (role === 'admin')
      ? allLeaves.filter(l => l.status === 'Submitted' && ['hr', 'management', 'accountant'].includes(l.userRole?.toLowerCase())).length
      : 0;

    // 5. User's own pending requests
    const myPendingRequests = allLeaves.filter(l => l.user_id === userId && l.status === 'Submitted').length;

    // 6. This month leaves (Taken only)
    const thisMonthLeaves = allLeaves.filter(l => 
      l.user_id === userId && 
      l.status === "Approved" && 
      !["Half Day", "Short Leave", "Early Leave"].includes(l.type) &&
      l.start_date.toISOString().startsWith(monthPrefix) &&
      l.start_date.toISOString().split('T')[0] < todayStr
    ).length;

    // 7. This month halfday (Taken only)
    const thisMonthHalfDays = allLeaves.filter(l => 
      l.user_id === userId && 
      l.status === "Approved" && 
      l.type === "Half Day" && 
      l.start_date.toISOString().startsWith(monthPrefix) &&
      l.start_date.toISOString().split('T')[0] < todayStr
    ).length;

    // 8. Paid leave taken this month
    const paidLeaveTaken = allLeaves.filter(l => 
      l.user_id === userId && 
      l.status === "Approved" && 
      l.type === "Paid Leave" &&
      l.start_date.toISOString().startsWith(monthPrefix) &&
      l.start_date.toISOString().split('T')[0] < todayStr
    ).length;

    res.json({
      onLeaveToday,
      onHalfDayToday,
      pendingRequests,
      adminPendingRequests,
      myPendingRequests,
      thisMonthLeaves,
      thisMonthHalfDays,
      paidLeaveTaken
    });
  } catch (error) {
    console.error('Error fetching leave stats:', error);
    res.status(500).json({ error: 'Failed to fetch leave stats' });
  }
});

// Convert 2 Half Days to 1 Paid Leave
router.post(`/leaves/convert`, authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    
    // 1. Find 2 approved Half Day leaves
    const [halfDays] = await pool.query(
      'SELECT id FROM leaves WHERE user_id = ? AND type = "Half Day" AND status = "Approved" LIMIT 2',
      [userId]
    );

    if (halfDays.length < 2) {
      return res.status(400).json({ error: 'You need at least 2 approved Half Day leaves to convert.' });
    }

    const ids = halfDays.map(h => h.id);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 2. Mark half days as Cancelled or delete them (using Cancelled for now as placeholder for "Used")
      // Better: we can just mark them as 'Cancelled' or add a new status.
      // Since we can't easily change ENUM here without migrations, we'll use 'Cancelled' 
      // but maybe it's better to just leave them and add the paid leave? No, that would double count.
      await connection.execute('UPDATE leaves SET status = "Cancelled", reason = CONCAT(reason, " (Converted to Paid Leave)") WHERE id IN (?, ?)', [ids[0], ids[1]]);

      // 3. Create a new Paid Leave
      // We'll use today's date or the date of the first half day
      const today = new Date().toISOString().split('T')[0];
      await connection.execute(
        'INSERT INTO leaves (user_id, type, status, start_date, end_date, reason) VALUES (?, "Paid Leave", "Approved", ?, ?, "Converted from 2 Half Days")',
        [userId, today, today]
      );

      await connection.commit();

      // Notify the user about the conversion
      await pool.query(
        'INSERT INTO notifications (user_id, type, title, message, category) VALUES (?, ?, ?, ?, ?)',
        [
          userId,
          'leave_status',
          'Leave Converted',
          'Successfully converted 2 Half Day leaves to 1 Paid Leave.',
          'HR'
        ]
      );

      res.json({ message: 'Successfully converted 2 half days to 1 paid leave.' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error converting leaves:', error);
    res.status(500).json({ error: 'Failed to convert leaves' });
  }
});

module.exports = router;
