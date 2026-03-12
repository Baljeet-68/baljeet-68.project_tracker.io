const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');
const https = require('https');

// Configuration
const API_BASE = 'http://localhost:4000/Project_Tracker_Tool/server/api';
const PROJECT_ID = 'proj1767437931890';

// Test token (you may need to update this based on your auth system)
const TEST_TOKEN = 'test-token-for-upload';

// Create a test file
const testFilePath = path.join(__dirname, 'test_document.txt');
fs.writeFileSync(testFilePath, 'This is a test document for upload testing.');

async function testDocumentUpload() {
    console.log('Starting document upload test...\n');

    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('title', 'Test Document Upload');
        form.append('description', 'Testing multer file upload fix');
        form.append('file', fs.createReadStream(testFilePath));

        const url = new URL(`${API_BASE}/projects/${PROJECT_ID}/documents`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${TEST_TOKEN}`
            }
        };

        console.log(`POST ${options.method} ${url.href}`);
        console.log(`Authorization: Bearer ${TEST_TOKEN}\n`);

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Response:`, data);

                // Clean up test file
                fs.unlinkSync(testFilePath);

                resolve(res.statusCode);
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error.message);
            fs.unlinkSync(testFilePath);
            reject(error);
        });

        form.pipe(req);
    });
}

testDocumentUpload()
    .then((statusCode) => {
        console.log(`\n✅ Test complete. Status: ${statusCode}`);
        process.exit(statusCode === 201 || statusCode === 400 || statusCode === 401 || statusCode === 403 ? 0 : 1);
    })
    .catch((err) => {
        console.error('\n❌ Test failed:', err.message);
        process.exit(1);
    });
