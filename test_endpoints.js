
const http = require('http');

const API_BASE = 'http://localhost:4000/api';

async function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => reject(e));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function measureRequest(method, path, data = null, token = null) {
  const start = Date.now();
  const res = await request(method, path, data, token);
  const end = Date.now();
  return { ...res, duration: end - start };
}

async function runTests() {
  console.log('--- Starting Comprehensive API Tests ---');
  const results = [];

  const logResult = (testName, status, duration, expectedStatus = 200, data = null) => {
    const success = Array.isArray(expectedStatus) ? expectedStatus.includes(status) : status === expectedStatus;
    results.push({ testName, status, duration, success, data, expectedStatus });
    console.log(`[${success ? 'PASS' : 'FAIL'}] ${testName} (${duration}ms) - Status: ${status} (Expected: ${expectedStatus})`);
  };

  // 1. Auth Tests
  let adminToken;
  const loginRes = await measureRequest('POST', '/login', { email: 'admin@example.com', password: 'admin123' });
  logResult('Admin Login', loginRes.status, loginRes.duration, 200);
  if (loginRes.status === 200) adminToken = loginRes.data.token;

  const invalidLoginRes = await measureRequest('POST', '/login', { email: 'admin@example.com', password: 'wrong' });
  logResult('Invalid Login', invalidLoginRes.status, invalidLoginRes.duration, 401);

  // 2. User Tests
  if (adminToken) {
    const meRes = await measureRequest('GET', '/me', null, adminToken);
    logResult('Get Current User', meRes.status, meRes.duration, 200);

    const usersRes = await measureRequest('GET', '/users', null, adminToken);
    logResult('Get All Users (Admin)', usersRes.status, usersRes.duration, 200);
  }

  // 3. Project Tests
  if (adminToken) {
    const projectsRes = await measureRequest('GET', '/projects', null, adminToken);
    logResult('Get All Projects', projectsRes.status, projectsRes.duration, 200);

    // Create Project
    const newProject = {
      name: 'Test Project ' + Date.now(),
      client: 'Test Client',
      description: 'Test Description',
      testerId: 'u1',
      developerIds: ['u3']
    };
    const createProjectRes = await measureRequest('POST', '/projects', newProject, adminToken);
    logResult('Create Project', createProjectRes.status, createProjectRes.duration, 201);
    
    if (createProjectRes.status === 201) {
      const projectId = createProjectRes.data.id;
      
      // Get Project by ID
      const getProjectRes = await measureRequest('GET', `/projects/${projectId}`, null, adminToken);
      logResult('Get Project By ID', getProjectRes.status, getProjectRes.duration, 200);

      // Update Project (PATCH instead of PUT)
      const updateProjectRes = await measureRequest('PATCH', `/projects/${projectId}`, { name: 'Updated Project Name' }, adminToken);
      logResult('Update Project', updateProjectRes.status, updateProjectRes.duration, 200);
    }
  }

  // 4. Bug Tests
  if (adminToken) {
    const bugsRes = await measureRequest('GET', '/bugs', null, adminToken);
    logResult('Get All Bugs', bugsRes.status, bugsRes.duration, 200);
    
    // Create Bug (using first project)
    const projectsRes = await request('GET', '/projects', null, adminToken);
    if (projectsRes.data && projectsRes.data.length > 0) {
      const projId = projectsRes.data[0].id;
      const newBug = {
        projectId: projId,
        description: 'Test Bug',
        severity: 'High',
        priority: 'High'
      };
      // Correct endpoint: POST /projects/:id/bugs
      const createBugRes = await measureRequest('POST', `/projects/${projId}/bugs`, newBug, adminToken);
      logResult('Create Bug', createBugRes.status, createBugRes.duration, 201);
    }
  }

    // 5. Announcements, Leaves, Notifications, etc.
  if (adminToken) {
    const announcementsRes = await measureRequest('GET', '/announcements', null, adminToken);
    logResult('Get Announcements', announcementsRes.status, announcementsRes.duration, 200);

    const leavesRes = await measureRequest('GET', '/leaves', null, adminToken);
    logResult('Get Leaves', leavesRes.status, leavesRes.duration, 200);

    const leaveStatsRes = await measureRequest('GET', '/leaves/stats/summary', null, adminToken);
    logResult('Get Leave Stats Summary', leaveStatsRes.status, leaveStatsRes.duration, 200);

    // 15. Notifications
    const notifsRes = await measureRequest('GET', '/notifications', null, adminToken);
    logResult('Get Notifications', notifsRes.status, notifsRes.duration, 200);

    if (notifsRes.data && notifsRes.data.length > 0) {
      const notifId = notifsRes.data[0].id;
      const markReadRes = await measureRequest('POST', `/notifications/${notifId}/mark-read`, null, adminToken);
      logResult('Mark Notification as Read', markReadRes.status, markReadRes.duration, 200);
    }

    const markAllReadRes = await measureRequest('POST', '/notifications/mark-all-read', null, adminToken);
    logResult('Mark All Notifications as Read', markAllReadRes.status, markAllReadRes.duration, 200);

    // 16. Update Profile
  const updateProfileRes = await measureRequest('PATCH', '/me', { name: 'Admin User Updated' }, adminToken);
  logResult('Update Profile (PATCH /me)', updateProfileRes.status, updateProfileRes.duration, 200);

  // 17. Verify Profile Update
    const verifyProfileRes = await measureRequest('GET', '/me', null, adminToken);
    if (verifyProfileRes.data.name === 'Admin User Updated') {
      logResult('Verify Profile Update', 200, verifyProfileRes.duration, 200);
    } else {
      logResult('Verify Profile Update (Name mismatch)', 500, verifyProfileRes.duration, 200);
    }

    // 18. Integration Test: Create Leave and Check Stats
    // First login as developer
    const devLoginRes = await measureRequest('POST', '/login', { email: 'alice@example.com', password: 'dev123' });
    const devToken = devLoginRes.data.token;

    // Use a future date (today + random offset) to avoid overlaps
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10 + Math.floor(Math.random() * 100));
    const startDateStr = futureDate.toISOString().split('T')[0];

    const createLeaveRes = await measureRequest('POST', '/leaves', {
      type: 'Full Day',
      start_date: startDateStr,
      reason: 'Testing Integration',
      is_emergency: false
    }, devToken);
    logResult('Create Leave (Integration)', createLeaveRes.status, createLeaveRes.duration, 201, createLeaveRes.data);

    const statsRes = await measureRequest('GET', '/leaves/stats/summary', null, adminToken);
    // The stats/summary doesn't seem to return recentRequests in the provided snippet. 
    // Let's check what it returns.
    logResult('Get Leave Stats Summary for Integration', statsRes.status, statsRes.duration, 200, statsRes.data);
    
    // Check if the leave is visible in the list
    const allLeavesRes = await measureRequest('GET', '/leaves', null, adminToken);
    const hasNewLeave = allLeavesRes.data && Array.isArray(allLeavesRes.data) && allLeavesRes.data.some(l => l.reason === 'Testing Integration');
    
    if (hasNewLeave) {
      logResult('Verify Leave in List', 200, allLeavesRes.duration, 200);
    } else {
      logResult('Verify Leave in List (Not found)', 500, allLeavesRes.duration, 200, allLeavesRes.data);
    }

    // 6. Error Handling & Edge Cases
    const nonExistentProjectRes = await measureRequest('GET', '/projects/non-existent-id', null, adminToken);
    logResult('Get Non-Existent Project', nonExistentProjectRes.status, nonExistentProjectRes.duration, 404);

    const unauthBugsRes = await measureRequest('GET', '/bugs', null, 'invalid-token');
    logResult('Unauthorized Access with Invalid Token', unauthBugsRes.status, unauthBugsRes.duration, 401);
  }

  console.log('\n--- API Tests Summary ---');
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / totalTests;

  console.log(`Total: ${totalTests}, Passed: ${passedTests}, Failed: ${totalTests - passedTests}`);
  console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);

  if (totalTests - passedTests > 0) {
    console.log('\n--- Failed Tests Details ---');
    results.filter(r => !r.success).forEach(r => {
      console.log(`Test: ${r.testName}, Status: ${r.status}, Error:`, JSON.stringify(r.data, null, 2));
    });
  }
}

runTests().catch(console.error);
