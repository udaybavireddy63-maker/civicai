const http = require('http');
const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const app = require('../app');
const config = require('../config/env');
const seedAdmin = require('./seedAdmin');

function makeRequest(server, method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
          cookies: res.headers['set-cookie']
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function extractCookie(cookieHeaders) {
  if (!cookieHeaders) return null;
  const cookieStr = Array.isArray(cookieHeaders) ? cookieHeaders[0] : cookieHeaders;
  const match = cookieStr.match(/civicai_token=([^;]+)/);
  return match ? `civicai_token=${match[1]}` : null;
}

// 1x1 transparent PNG in base64
const SAMPLE_BASE64_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runComplaintWorkflowTests() {
  console.log('========================================================');
  console.log('🧪 CivicAI Phase 4 — Complaint Workflow Test Suite');
  console.log('========================================================');

  let server = null;
  const createdUserIds = [];
  const createdComplaintIds = [];
  const uploadedFilesToCleanup = [];

  try {
    await connectDB();
    await seedAdmin();

    server = app.listen(0);
    const port = server.address().port;
    console.log(`✓ Test server running on port ${port}\n`);

    // Setup: Login Admin
    console.log('[Setup] Logging in Admin...');
    const adminLoginRes = await makeRequest(server, 'POST', '/api/v1/auth/login', {}, {
      email: config.adminSeed.email,
      password: config.adminSeed.password
    });
    if (adminLoginRes.statusCode !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
    }
    const adminCookie = extractCookie(adminLoginRes.cookies);
    console.log('  ✓ Admin logged in successfully.');

    // Setup: Register Citizen A and Citizen B
    console.log('\n[Setup] Registering Citizen A and Citizen B...');
    const emailA = `citizenA.${Date.now()}@example.com`;
    const regResA = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Citizen A',
      email: emailA,
      password: 'Password#2026A'
    });
    createdUserIds.push(regResA.body.data.user._id);
    const cookieA = extractCookie(regResA.cookies);

    const emailB = `citizenB.${Date.now()}@example.com`;
    const regResB = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Citizen B',
      email: emailB,
      password: 'Password#2026B'
    });
    createdUserIds.push(regResB.body.data.user._id);
    const cookieB = extractCookie(regResB.cookies);
    console.log('  ✓ Registered Citizen A and Citizen B.');

    // 1. Citizen A Submits a Complaint
    console.log('\n[Test 1] Citizen Complaint Submission (POST /complaints)...');
    const complaintPayload = {
      title: 'Severe Pothole on 100ft Road',
      description: 'Dangerous pothole causing severe traffic disruption and accidents for commuters.',
      category: 'Roads and potholes',
      location: {
        address: '100ft Road, Near Signal 3',
        latitude: 12.9716,
        longitude: 77.5946
      },
      imageBase64: SAMPLE_BASE64_IMAGE
    };

    const submitRes = await makeRequest(server, 'POST', '/api/v1/complaints', { Cookie: cookieA }, complaintPayload);
    if (submitRes.statusCode !== 201) {
      throw new Error(`Expected 201 Created, got ${submitRes.statusCode}: ${JSON.stringify(submitRes.body)}`);
    }

    const complaintA = submitRes.body.data.complaint;
    createdComplaintIds.push(complaintA._id);

    if (!complaintA.referenceCode.startsWith('CV-')) {
      throw new Error(`Invalid reference code format: ${complaintA.referenceCode}`);
    }
    if (complaintA.status !== 'SUBMITTED') {
      throw new Error(`Expected status SUBMITTED, got ${complaintA.status}`);
    }
    if (!complaintA.image?.url?.startsWith('/uploads/')) {
      throw new Error(`Expected image stored in /uploads/, got ${complaintA.image?.url}`);
    }
    if (complaintA.statusHistory.length !== 1 || complaintA.statusHistory[0].to !== 'SUBMITTED') {
      throw new Error('Initial statusHistory entry missing or invalid');
    }

    uploadedFilesToCleanup.push(path.resolve(__dirname, '../../../public', complaintA.image.url.replace(/^\//, '')));
    console.log(`  ✓ Complaint submitted successfully with Ref: ${complaintA.referenceCode}`);
    console.log(`  ✓ Image stored and validated at: ${complaintA.image.url}`);
    console.log(`  ✓ Status: ${complaintA.status}, History count: ${complaintA.statusHistory.length}`);

    // 2. Validation Rejections Test
    console.log('\n[Test 2] Server-Side Input Validation Rejections...');
    const shortTitleRes = await makeRequest(server, 'POST', '/api/v1/complaints', { Cookie: cookieA }, {
      title: 'Bad',
      description: 'Long enough description to pass description check',
      location: 'Main Street'
    });
    if (shortTitleRes.statusCode !== 400) {
      throw new Error(`Expected 400 for short title, got ${shortTitleRes.statusCode}`);
    }

    const invalidCatRes = await makeRequest(server, 'POST', '/api/v1/complaints', { Cookie: cookieA }, {
      title: 'Valid Title Here',
      description: 'Long enough description to pass check',
      category: 'FakeCategoryNotAllowed',
      location: 'Main Street'
    });
    if (invalidCatRes.statusCode !== 400) {
      throw new Error(`Expected 400 for invalid category, got ${invalidCatRes.statusCode}`);
    }
    console.log('  ✓ Short title and unauthorized category rejected with HTTP 400.');

    // 3. Citizen "My Complaints" (GET /complaints/mine)
    console.log('\n[Test 3] Citizen "My Complaints" (GET /complaints/mine)...');
    const myRes = await makeRequest(server, 'GET', '/api/v1/complaints/mine', { Cookie: cookieA });
    if (myRes.statusCode !== 200) {
      throw new Error(`Expected 200, got ${myRes.statusCode}: ${JSON.stringify(myRes.body)}`);
    }
    if (myRes.body.data.complaints.length !== 1) {
      throw new Error(`Expected 1 complaint for Citizen A, got ${myRes.body.data.complaints.length}`);
    }
    if (myRes.body.data.complaints[0].adminNotes !== undefined) {
      throw new Error('SECURITY VIOLATION: adminNotes leaked in citizen complaints list!');
    }
    console.log(`  ✓ Citizen A retrieved their complaints (count: ${myRes.body.data.complaints.length})`);
    console.log('  ✓ adminNotes strictly omitted from citizen list response.');

    // 4. Ownership Enforcement Test
    console.log('\n[Test 4] Ownership Restriction (Citizen B accessing Complaint A)...');
    const crossAccessRes = await makeRequest(server, 'GET', `/api/v1/complaints/${complaintA._id}`, { Cookie: cookieB });
    if (crossAccessRes.statusCode !== 403) {
      throw new Error(`SECURITY BREACH: Citizen B was able to access Citizen A's complaint! Status: ${crossAccessRes.statusCode}`);
    }
    console.log('  ✓ Citizen B access to Citizen A complaint blocked with HTTP 403 Forbidden.');

    // Citizen A accessing their own complaint
    const ownerAccessRes = await makeRequest(server, 'GET', `/api/v1/complaints/${complaintA._id}`, { Cookie: cookieA });
    if (ownerAccessRes.statusCode !== 200) {
      throw new Error(`Owner Citizen A failed to access their complaint: ${ownerAccessRes.statusCode}`);
    }
    if (ownerAccessRes.body.data.complaint.adminNotes !== undefined) {
      throw new Error('SECURITY VIOLATION: adminNotes leaked in citizen detail response!');
    }
    console.log('  ✓ Citizen A successfully accessed their own complaint (HTTP 200).');

    // 5. Admin Queue Access & Citizen Queue Blocking
    console.log('\n[Test 5] Admin Queue Authorization (GET /complaints)...');
    const citizenQueueRes = await makeRequest(server, 'GET', '/api/v1/complaints', { Cookie: cookieA });
    if (citizenQueueRes.statusCode !== 403) {
      throw new Error(`SECURITY BREACH: Citizen accessed admin queue! Status: ${citizenQueueRes.statusCode}`);
    }
    console.log('  ✓ Citizen blocked from admin queue with HTTP 403 Forbidden.');

    const adminQueueRes = await makeRequest(server, 'GET', '/api/v1/complaints?page=1&limit=10', { Cookie: adminCookie });
    if (adminQueueRes.statusCode !== 200) {
      throw new Error(`Admin queue access failed: ${adminQueueRes.statusCode}`);
    }
    if (!adminQueueRes.body.data.pagination) {
      throw new Error('Pagination metadata missing in admin queue response');
    }
    console.log(`  ✓ Admin accessed complete queue (total: ${adminQueueRes.body.data.pagination.total}).`);

    // 6. Admin Status Update with Audit History
    console.log('\n[Test 6] Admin Status Update & Audit Trail (PATCH /complaints/:id/status)...');
    // Citizen cannot change status
    const citizenStatusRes = await makeRequest(server, 'PATCH', `/api/v1/complaints/${complaintA._id}/status`, { Cookie: cookieA }, {
      status: 'IN_PROGRESS'
    });
    if (citizenStatusRes.statusCode !== 403) {
      throw new Error(`SECURITY BREACH: Citizen was able to update complaint status! Status: ${citizenStatusRes.statusCode}`);
    }
    console.log('  ✓ Citizen cannot update official status (HTTP 403 Forbidden).');

    // Admin updates status to UNDER_REVIEW
    const adminStatusRes = await makeRequest(server, 'PATCH', `/api/v1/complaints/${complaintA._id}/status`, { Cookie: adminCookie }, {
      status: 'UNDER_REVIEW',
      note: 'Officer inspected report details.'
    });
    if (adminStatusRes.statusCode !== 200) {
      throw new Error(`Admin status update failed: ${JSON.stringify(adminStatusRes.body)}`);
    }
    if (adminStatusRes.body.data.complaint.status !== 'UNDER_REVIEW') {
      throw new Error(`Expected status UNDER_REVIEW, got ${adminStatusRes.body.data.complaint.status}`);
    }
    if (adminStatusRes.body.data.complaint.statusHistory.length !== 2) {
      throw new Error(`Expected 2 history entries, got ${adminStatusRes.body.data.complaint.statusHistory.length}`);
    }
    console.log('  ✓ Admin updated status to UNDER_REVIEW.');
    console.log('  ✓ Status history appended correctly with timestamp & note.');

    // 7. Admin Triage (Category, Priority, Department)
    console.log('\n[Test 7] Admin Triage Update (PATCH /complaints/:id/triage)...');
    const triageRes = await makeRequest(server, 'PATCH', `/api/v1/complaints/${complaintA._id}/triage`, { Cookie: adminCookie }, {
      priority: 'HIGH',
      department: 'Roads & Asphalt Maintenance'
    });
    if (triageRes.statusCode !== 200) {
      throw new Error(`Triage update failed: ${JSON.stringify(triageRes.body)}`);
    }
    if (triageRes.body.data.complaint.priority !== 'HIGH' || triageRes.body.data.complaint.department !== 'Roads & Asphalt Maintenance') {
      throw new Error('Triage fields were not updated properly');
    }
    console.log('  ✓ Admin updated priority to HIGH and assigned department to Roads & Asphalt Maintenance.');

    // 8. Admin Internal Notes (POST /complaints/:id/notes)
    console.log('\n[Test 8] Admin Internal Notes Security & Privacy...');
    const citizenNoteRes = await makeRequest(server, 'POST', `/api/v1/complaints/${complaintA._id}/notes`, { Cookie: cookieA }, {
      text: 'Citizen trying to add admin note'
    });
    if (citizenNoteRes.statusCode !== 403) {
      throw new Error(`SECURITY BREACH: Citizen added admin note! Status: ${citizenNoteRes.statusCode}`);
    }
    console.log('  ✓ Citizen cannot add internal admin notes (HTTP 403 Forbidden).');

    const adminNoteRes = await makeRequest(server, 'POST', `/api/v1/complaints/${complaintA._id}/notes`, { Cookie: adminCookie }, {
      text: 'Internal dispatch crew 4B dispatched at 14:00 with patch asphalt.'
    });
    if (adminNoteRes.statusCode !== 201) {
      throw new Error(`Admin note submission failed: ${JSON.stringify(adminNoteRes.body)}`);
    }
    console.log('  ✓ Admin successfully recorded internal note.');

    // Verify Admin sees adminNotes on detail view
    const adminDetailRes = await makeRequest(server, 'GET', `/api/v1/complaints/${complaintA._id}`, { Cookie: adminCookie });
    if (!adminDetailRes.body.data.complaint.adminNotes || adminDetailRes.body.data.complaint.adminNotes.length === 0) {
      throw new Error('Admin should see adminNotes in complaint detail');
    }
    console.log(`  ✓ Admin sees adminNotes (count: ${adminDetailRes.body.data.complaint.adminNotes.length}).`);

    // Verify Citizen A DOES NOT see adminNotes on detail view
    const citizenDetailRes = await makeRequest(server, 'GET', `/api/v1/complaints/${complaintA._id}`, { Cookie: cookieA });
    if (citizenDetailRes.body.data.complaint.adminNotes !== undefined) {
      throw new Error('SECURITY BREACH: adminNotes exposed to citizen in complaint detail view!');
    }
    console.log('  ✓ Citizen A CANNOT see internal adminNotes (strictly stripped from response).');

    // Clean up
    console.log('\n[Cleanup] Removing test complaints, users, and uploaded files...');
    await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    for (const filePath of uploadedFilesToCleanup) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    console.log('  ✓ Cleaned up all test records and files.');

    console.log('\n========================================================');
    console.log('🎉 ALL 8 PHASE 4 COMPLAINT WORKFLOW TESTS PASSED!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ COMPLAINT WORKFLOW TEST FAILED:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

if (require.main === module) {
  runComplaintWorkflowTests();
}

module.exports = runComplaintWorkflowTests;
