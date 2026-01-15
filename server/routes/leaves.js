const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticate } = require('../middleware/auth');
const { getLeaves, getUsers } = require('../middleware/helpers');
const { USE_LIVE_DB } = require('../config');
const localData = !USE_LIVE_DB ? require('../data') : null;

// Helper to safely get ISO date string (YYYY-MM-DD)
const getSafeDate = (d) => {
  if (!d) return '';
  const dateObj = (d instanceof Date) ? d : new Date(d);
  if (isNaN(dateObj.getTime())) return '';
  return dateObj.toISOString().split('T')[0];
};

// Define data source functions
let leavesSource;
let createLeaveInDbSource;
let updateLeaveInDbSource;
let deleteLeaveFromDbSource;
let usersSource;
let createNotificationInDbSource;

if (USE_LIVE_DB) {
  const dbApi = require('../api');
  leavesSource = async () => await dbApi.getLeavesFromMySQL ? await dbApi.getLeavesFromMySQL() : [];
  createLeaveInDbSource = async (leave) => {
    const sql = `INSERT INTO leaves 
      (user_id, type, status, start_date, end_date, half_day_period, short_leave_time, compensation_worked_date, compensation_worked_time, reason, approver_id, is_emergency) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const [result] = await pool.execute(sql, [
      leave.user_id, leave.type, leave.status, leave.start_date, leave.end_date || leave.start_date, 
      leave.half_day_period, leave.short_leave_time, leave.compensation_worked_date, leave.compensation_worked_time, 
      leave.reason, leave.approver_id, leave.is_emergency ? 1 : 0
    ]);
    return { ...leave, id: result.insertId };
  };
  updateLeaveInDbSource = async (id, changes) => {
    const fields = [];
    const values = [];
    Object.keys(changes).forEach(key => {
      fields.push(`${key} = ?`);
      values.push(changes[key]);
    });
    values.push(id);
    await pool.execute(`UPDATE leaves SET ${fields.join(', ')} WHERE id = ?`, values);
  };
  usersSource = async () => {
    const [rows] = await pool.query('SELECT * FROM users');
    return rows;
  };
  createNotificationInDbSource = async (notification) => {
    await pool.query(
      'INSERT INTO notifications (user_id, type, title, message, category) VALUES (?, ?, ?, ?, ?)',
      [notification.user_id, notification.type, notification.title, notification.message, notification.category]
    );
  };
} else {
  leavesSource = async () => localData.leaves || [];
  createLeaveInDbSource = async (leave) => {
    if (!localData.leaves) localData.leaves = [];
    const newLeave = { ...leave, id: `lv${Date.now()}` };
    localData.leaves.push(newLeave);
    return newLeave;
  };
  updateLeaveInDbSource = async (id, changes) => {
    if (!localData.leaves) return;
    const idx = localData.leaves.findIndex(l => String(l.id) === String(id));
    if (idx > -1) localData.leaves[idx] = { ...localData.leaves[idx], ...changes };
  };
  usersSource = async () => localData.users || [];
  createNotificationInDbSource = async (notification) => {
    if (!localData.notifications) localData.notifications = [];
    localData.notifications.push({ ...notification, id: `notif${Date.now()}`, status: 'unread', created_at: new Date().toISOString() });
  };
}

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
    if (USE_LIVE_DB) {
      if (approver_role !== 'hr_or_admin') {
        const [approvers] = await pool.query('SELECT id FROM users WHERE role = ? LIMIT 1', [approver_role]);
        approver_id = approvers.length > 0 ? approvers[0].id : null;
      } else {
        const [approvers] = await pool.query('SELECT id FROM users WHERE role = "hr" LIMIT 1');
        approver_id = approvers.length > 0 ? approvers[0].id : null;
      }
    } else {
      const users = await usersSource();
      if (approver_role !== 'hr_or_admin') {
        const approver = users.find(u => u.role === approver_role);
        approver_id = approver ? approver.id : null;
      } else {
        const approver = users.find(u => u.role === 'hr');
        approver_id = approver ? approver.id : null;
      }
    }

    // Rules Validation
    const monthStart = new Date(start_date);
    monthStart.setDate(1);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    // 1. Max 2 short leaves per month
    if (type === 'Short Leave' || type === 'Early Leave') {
      let shortCount = 0;
      if (USE_LIVE_DB) {
        const [shortLeaves] = await pool.query(
          'SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND type IN ("Short Leave", "Early Leave") AND start_date BETWEEN ? AND ? AND status != "Rejected"',
          [userId, monthStart, monthEnd]
        );
        shortCount = shortLeaves[0].count;
      } else {
        const leaves = await leavesSource();
        shortCount = leaves.filter(l => 
          l.user_id === userId && 
          ['Short Leave', 'Early Leave'].includes(l.type) && 
          new Date(l.start_date) >= monthStart && 
          new Date(l.start_date) <= monthEnd && 
          l.status !== 'Rejected'
        ).length;
      }
      if (shortCount >= 2) {
        // Warning logic
      }
    }

    // 2. Max 1 paid leave per month
    if (type === 'Paid Leave') {
      let paidCount = 0;
      if (USE_LIVE_DB) {
        const [paidLeaves] = await pool.query(
          'SELECT COUNT(*) as count FROM leaves WHERE user_id = ? AND type = "Paid Leave" AND start_date BETWEEN ? AND ? AND status NOT IN ("Rejected", "Cancelled")',
          [userId, monthStart, monthEnd]
        );
        paidCount = paidLeaves[0].count;
      } else {
        const leaves = await leavesSource();
        paidCount = leaves.filter(l => 
          l.user_id === userId && 
          l.type === 'Paid Leave' && 
          new Date(l.start_date) >= monthStart && 
          new Date(l.start_date) <= monthEnd && 
          !['Rejected', 'Cancelled'].includes(l.status)
        ).length;
      }
      if (paidCount >= 1) {
        return res.status(400).json({ error: 'Maximum 1 paid leave per month allowed' });
      }
    }

    // 5. No overlapping or duplicate leave dates
    let hasOverlap = false;
    const endDateVal = end_date || start_date;
    if (USE_LIVE_DB) {
      const [overlap] = await pool.query(
        'SELECT id FROM leaves WHERE user_id = ? AND status NOT IN ("Rejected", "Cancelled") AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))',
        [userId, endDateVal, start_date, endDateVal, start_date]
      );
      hasOverlap = overlap.length > 0;
    } else {
      const leaves = await leavesSource();
      hasOverlap = leaves.some(l => {
        if (l.user_id !== userId || ['Rejected', 'Cancelled'].includes(l.status)) return false;
        const lStart = getSafeDate(l.start_date);
        const lEnd = getSafeDate(l.end_date) || lStart;
        return (lStart <= endDateVal && lEnd >= start_date);
      });
    }

    if (hasOverlap) {
      return res.status(400).json({ error: 'Leave request overlaps with an existing leave' });
    }

    const leave = await createLeaveInDbSource({
      user_id: userId, type, status, start_date, end_date: end_date || start_date, 
      half_day_period, short_leave_time, compensation_worked_date, compensation_worked_time, 
      reason, approver_id, is_emergency: is_emergency ? 1 : 0
    });

    // Create Notifications for HR or Admin
    if (status === 'Submitted') {
      const allUsers = await usersSource();
      const user = allUsers.find(u => String(u.id) === String(userId));
      const userName = user?.name || 'Someone';
      
      let notifyRoles = [];
      if (role === 'hr') {
        notifyRoles = ['admin'];
      } else if (['management', 'accountant'].includes(role.toLowerCase())) {
        notifyRoles = ['hr', 'admin'];
      } else {
        notifyRoles = ['hr'];
      }

      const targetUsers = allUsers.filter(u => notifyRoles.includes(u.role));
      
      // Format date for notification
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' };
      const formattedStartDate = new Date(start_date).toLocaleDateString('en-IN', dateOptions);
      const formattedEndDate = end_date ? new Date(end_date).toLocaleDateString('en-IN', dateOptions) : null;
      const dateDisplay = formattedEndDate && formattedEndDate !== formattedStartDate 
        ? `${formattedStartDate} to ${formattedEndDate}`
        : formattedStartDate;

      const halfDayInfo = type === 'Half Day' ? ` (${half_day_period})` : '';
      
      for (const targetUser of targetUsers) {
        await createNotificationInDbSource({
          user_id: targetUser.id, 
          type: 'leave_request', 
          title: 'New Leave Request', 
          message: `${userName} has submitted a ${type} request for ${dateDisplay}${halfDayInfo}.`,
          category: 'HR'
        });
      }
    }

    res.status(201).json({ message: 'Leave request submitted successfully' });
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
    const allLeaves = await leavesSource();
    const leave = allLeaves.find(l => String(l.id) === String(id));
    if (!leave) return res.status(404).json({ error: 'Leave not found' });

    const allUsers = await usersSource();
    const targetUser = allUsers.find(u => String(u.id) === String(leave.user_id));
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const targetUserRole = targetUser.role.toLowerCase();
    let canApprove = false;

    if (role === 'admin') {
      canApprove = true; 
    } else if (role === 'hr') {
      if (['tester', 'developer', 'ecommerce', 'management', 'accountant'].includes(targetUserRole)) {
        canApprove = true;
      }
    }

    if (!canApprove) {
      return res.status(403).json({ error: 'You are not authorized to approve this leave request' });
    }

    await updateLeaveInDbSource(id, { status, approver_id: userId });
    
    // Notify the user about approval/rejection
    const { type, start_date, half_day_period } = leave;
    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' };
    const formattedDate = new Date(start_date).toLocaleDateString('en-IN', dateOptions);
    const halfDayInfo = type === 'Half Day' ? ` (${half_day_period})` : '';

    await createNotificationInDbSource({
      user_id: leave.user_id,
      type: 'leave_status',
      title: `Leave Request ${status}`,
      message: `Your ${type} request for ${formattedDate}${halfDayInfo} has been ${status.toLowerCase()}.`,
      category: 'HR'
    });
    
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

    const allLeaves = await leavesSource();
    const leave = allLeaves.find(l => String(l.id) === String(id) && String(l.user_id) === String(userId));
    if (!leave) return res.status(404).json({ error: 'Leave not found' });

    if (leave.status !== 'Submitted' && leave.status !== 'Pending Approval') {
      return res.status(400).json({ error: 'Only pending leaves can be cancelled' });
    }

    await updateLeaveInDbSource(id, { status: 'Cancelled' });

    // Notify HR or Admin about cancellation
    const allUsers = await usersSource();
    const user = allUsers.find(u => String(u.id) === String(userId));
    const userName = user?.name || 'Someone';
    const userRole = user?.role || '';

    let notifyRole = 'hr';
    if (['hr', 'management', 'accountant'].includes(userRole.toLowerCase())) {
      notifyRole = 'admin';
    }

    const targetUsers = allUsers.filter(u => u.role === notifyRole);
    
    for (const targetUser of targetUsers) {
      const { type, start_date, half_day_period } = leave;
      const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Kolkata' };
      const formattedDate = new Date(start_date).toLocaleDateString('en-IN', dateOptions);
      const halfDayInfo = type === 'Half Day' ? ` (${half_day_period})` : '';

      await createNotificationInDbSource({
        user_id: targetUser.id, 
        type: 'leave_cancelled', 
        title: 'Leave Request Cancelled', 
        message: `${userName} has cancelled their ${type} request for ${formattedDate}${halfDayInfo}.`,
        category: 'HR'
      });
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
    const onLeaveToday = allLeaves.filter(l => {
      if (l.status !== 'Approved') return false;
      const start = getSafeDate(l.start_date);
      const end = getSafeDate(l.end_date) || start;
      return todayStr >= start && todayStr <= end && ["Full Day", "Paid Leave", "Compensation"].includes(l.type);
    }).length;

    // 2. On halfday today
    const onHalfDayToday = allLeaves.filter(l => {
      if (l.status !== 'Approved') return false;
      const start = getSafeDate(l.start_date);
      const end = getSafeDate(l.end_date) || start;
      return todayStr >= start && todayStr <= end && l.type === "Half Day";
    }).length;

    // 3. Pending requests (for HR or Admin based on matrix)
    const pendingRequests = (role === 'admin' || role === 'hr') 
      ? allLeaves.filter(l => l.status === 'Submitted').length 
      : 0;

    // 4. Specifically for Admin: Pending from HR/Management/Accountant
    let adminPendingRequests = 0;
    if (role === 'admin') {
      const allUsers = await usersSource();
      adminPendingRequests = allLeaves.filter(l => {
        if (l.status !== 'Submitted') return false;
        const user = allUsers.find(u => String(u.id) === String(l.user_id));
        const userRole = user?.role?.toLowerCase() || '';
        return ['hr', 'management', 'accountant'].includes(userRole);
      }).length;
    }

    // 5. User's own pending requests
    const myPendingRequests = allLeaves.filter(l => l.user_id === userId && l.status === 'Submitted').length;

    // 6. This month leaves (Taken only)
    const thisMonthLeaves = allLeaves.filter(l => {
      const start = getSafeDate(l.start_date);
      return (
        l.user_id === userId && 
        l.status === "Approved" && 
        !["Half Day", "Short Leave", "Early Leave"].includes(l.type) &&
        start.startsWith(monthPrefix) &&
        start < todayStr
      );
    }).length;

    // 7. This month halfday (Taken only)
    const thisMonthHalfDays = allLeaves.filter(l => {
      const start = getSafeDate(l.start_date);
      return (
        l.user_id === userId && 
        l.status === "Approved" && 
        l.type === "Half Day" && 
        start.startsWith(monthPrefix) &&
        start < todayStr
      );
    }).length;

    // 8. Paid leave taken this month
    const paidLeaveTaken = allLeaves.filter(l => {
      const start = getSafeDate(l.start_date);
      return (
        l.user_id === userId && 
        l.status === "Approved" && 
        l.type === "Paid Leave" &&
        start.startsWith(monthPrefix) &&
        start < todayStr
      );
    }).length;

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
    let halfDays;
    if (USE_LIVE_DB) {
      const [rows] = await pool.query(
        'SELECT id FROM leaves WHERE user_id = ? AND type = "Half Day" AND status = "Approved" LIMIT 2',
        [userId]
      );
      halfDays = rows;
    } else {
      const allLeaves = await leavesSource();
      halfDays = allLeaves.filter(l => l.user_id === userId && l.type === "Half Day" && l.status === "Approved").slice(0, 2);
    }

    if (halfDays.length < 2) {
      return res.status(400).json({ error: 'You need at least 2 approved Half Day leaves to convert.' });
    }

    const ids = halfDays.map(h => h.id);

    if (USE_LIVE_DB) {
      // Start transaction
      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // 2. Mark half days as Cancelled
        await connection.execute('UPDATE leaves SET status = "Cancelled", reason = CONCAT(reason, " (Converted to Paid Leave)") WHERE id IN (?, ?)', [ids[0], ids[1]]);

        // 3. Create a new Paid Leave
        const today = new Date().toISOString().split('T')[0];
        await connection.execute(
          'INSERT INTO leaves (user_id, type, status, start_date, end_date, reason) VALUES (?, "Paid Leave", "Approved", ?, ?, "Converted from 2 Half Days")',
          [userId, today, today]
        );

        await connection.commit();

        // Notify the user about the conversion
        await pool.query(
          'INSERT INTO notifications (user_id, type, title, message, category) VALUES (?, ?, ?, ?, ?)',
          [userId, 'leave_status', 'Leave Converted', 'Successfully converted 2 Half Day leaves to 1 Paid Leave.', 'HR']
        );

        res.json({ message: 'Successfully converted 2 half days to 1 paid leave.' });
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      // Local Mode Conversion
      await updateLeaveInDbSource(ids[0], { status: 'Cancelled', reason: 'Converted to Paid Leave' });
      await updateLeaveInDbSource(ids[1], { status: 'Cancelled', reason: 'Converted to Paid Leave' });

      const today = new Date().toISOString().split('T')[0];
      await createLeaveInDbSource({
        user_id: userId,
        type: 'Paid Leave',
        status: 'Approved',
        start_date: today,
        end_date: today,
        reason: 'Converted from 2 Half Days'
      });

      await createNotificationInDbSource({
        user_id: userId,
        type: 'leave_status',
        title: 'Leave Converted',
        message: 'Successfully converted 2 Half Day leaves to 1 Paid Leave.',
        category: 'HR'
      });

      res.json({ message: 'Successfully converted 2 half days to 1 paid leave.' });
    }
  } catch (error) {
    console.error('Error converting leaves:', error);
    res.status(500).json({ error: 'Failed to convert leaves' });
  }
});

module.exports = router;
