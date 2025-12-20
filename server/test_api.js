// server/test_api.js
// Quick test to verify the projects endpoint works with MySQL
require('dotenv').config();
const http = require('http');
const BASE_URL = process.env.BASE_URL || '';

function httpRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function test() {
  console.log('=== API Test ===\n');

  try {
    // Test 1: Login
    console.log('1. Testing login...');
    const loginRes = await httpRequest({
      hostname: 'localhost',
      port: 4000,
      path: `${BASE_URL}/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ email: 'admin@example.com', password: 'admin123' }));

    if (loginRes.status !== 200 || !loginRes.data.token) {
      console.log('✗ Login failed:', loginRes.data);
      return;
    }

    const token = loginRes.data.token;
    console.log('✓ Login successful');
    console.log(`  Token: ${token.substring(0, 20)}...\n`);

    // Test 2: Get projects
    console.log('2. Testing GET /api/projects...');
    const projectsRes = await httpRequest({
      hostname: 'localhost',
      port: 4000,
      path: `${BASE_URL}/api/projects`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (projectsRes.status !== 200) {
      console.log(`✗ Request failed with status ${projectsRes.status}:`, projectsRes.data);
      return;
    }

    const projects = projectsRes.data;
    if (Array.isArray(projects)) {
      console.log(`✓ Got ${projects.length} projects from MySQL:\n`);
      projects.forEach(p => {
        console.log(`  - ${p.id}: ${p.name}`);
        console.log(`    Client: ${p.client}`);
        console.log(`    Status: ${p.status}`);
        console.log(`    Developers: ${JSON.stringify(p.developerIds)}\n`);
      });
    } else {
      console.log('✗ Unexpected response');
      console.log(projects);
    }
  } catch (err) {
    console.error('Test failed:', err.message);
  }
}

test();
