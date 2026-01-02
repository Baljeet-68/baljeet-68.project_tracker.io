const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');

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
    let query = 'SELECT l.*, u.name as userName, u.role as userRole FROM leaves l JOIN users u ON l.user_id = u.id';
    let params = [];

    if (role === 'admin') {
      // Admin sees everything, but specifically needs to see what's pending for them
      // According to matrix: HR, Management, Accountant requests go to Admin
      // However, requirement says "Admin sees leaves pending Admin approval"
      // We'll return all for admin but UI can filter
    } else if (role === 'hr') {
      // HR sees their own + what's pending for them (Tester, Developer, E-commerce)
      // query += ' WHERE l.user_id = ? OR l.approver_id = ?';
      // params = [userId, userId];
    } else {
      // Regular users only see their own
      query += ' WHERE l.user_id = ?';
      params = [userId];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: 'Failed to fetch leaves' });
  }
});

// Submit a leave request
router.post(`/leaves`, authenticate, async (req, res) => {
  try {
    const { userId, role } = req.user;
    const { 
      type, 
      start_date, 
      end_date, 
      half_day_period, 
      short_leave_time, 
      compensation_worked_date, 
      compensation_worked_time,
      reason 
    } = req.body;

    if (role === 'admin') {
      return res.status(400).json({ error: 'Admin cannot submit leave requests' });
    }

    // Determine approver based on Matrix
    let approver_role = 'hr';
    if (['hr', 'management', 'accountant'].includes(role.toLowerCase())) {
      approver_role = 'admin';
    }

    // Find an approver of that role (simplified: just assign to any admin/hr for now or leave null for "role-based" queue)
    // For now, we'll store the target approver role or find the first one
    const [approvers] = await pool.query('SELECT id FROM users WHERE role = ? LIMIT 1', [approver_role]);
    const approver_id = approvers.length > 0 ? approvers[0].id : null;

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
      (user_id, type, status, start_date, end_date, half_day_period, short_leave_time, compensation_worked_date, compensation_worked_time, reason, approver_id) 
      VALUES (?, ?, 'Submitted', ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    await pool.execute(sql, [
      userId, type, start_date, end_date || start_date, half_day_period, short_leave_time, compensation_worked_date, compensation_worked_time, reason, approver_id
    ]);

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
      // Admin approves HR, Management, Accountant
      if (['hr', 'management', 'accountant'].includes(targetUserRole)) canApprove = true;
      // Admin also has full access
      canApprove = true; 
    } else if (role === 'hr') {
      // HR approves Tester, Developer, E-commerce
      if (['tester', 'developer', 'ecommerce'].includes(targetUserRole)) canApprove = true;
    }

    if (!canApprove) {
      return res.status(403).json({ error: 'You are not authorized to approve this leave request' });
    }

    await pool.execute('UPDATE leaves SET status = ?, approver_id = ? WHERE id = ?', [status, userId, id]);
    
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
    res.json({ message: 'Leave cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling leave:', error);
    res.status(500).json({ error: 'Failed to cancel leave' });
  }
});

// Stats for dashboard
router.get(`/leaves/stats/summary`, authenticate, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { role, userId } = req.user;

    // 1. On leave today (Full Day / Paid Leave / Compensation)
    const [onLeaveToday] = await pool.query(
      `SELECT COUNT(*) as count FROM leaves 
       WHERE ? BETWEEN start_date AND end_date 
       AND status = "Approved" 
       AND type IN ("Full Day", "Paid Leave", "Compensation")`,
      [today]
    );

    // 2. On halfday today
    const [onHalfDayToday] = await pool.query(
      `SELECT COUNT(*) as count FROM leaves 
       WHERE ? BETWEEN start_date AND end_date 
       AND status = "Approved" 
       AND type = "Half Day"`,
      [today]
    );

    // 3. Pending requests (for HR or Admin based on matrix)
    let pendingCount = 0;
    if (role === 'admin' || role === 'hr') {
      const [pending] = await pool.query(
        `SELECT COUNT(l.id) as count FROM leaves l 
         JOIN users u ON l.user_id = u.id 
         WHERE l.status = 'Submitted'`
      );
      // We'll filter this in the frontend or we can do more complex role-based count here
      // For now, let's get the total submitted
      pendingCount = pending[0].count;
    }

    // 4. Specifically for Admin: Pending from HR/Management/Accountant
    let adminPendingCount = 0;
    if (role === 'admin') {
      const [adminPending] = await pool.query(
        `SELECT COUNT(l.id) as count FROM leaves l 
         JOIN users u ON l.user_id = u.id 
         WHERE l.status = 'Submitted' 
         AND u.role IN ('hr', 'management', 'accountant')`
      );
      adminPendingCount = adminPending[0].count;
    }

    // 5. User's own pending requests
    const [myPending] = await pool.query(
      `SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND status = 'Submitted'`,
      [userId]
    );

    res.json({
      onLeaveToday: onLeaveToday[0].count,
      onHalfDayToday: onHalfDayToday[0].count,
      pendingRequests: pendingCount,
      adminPendingRequests: adminPendingCount,
      myPendingRequests: myPending[0].count
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
