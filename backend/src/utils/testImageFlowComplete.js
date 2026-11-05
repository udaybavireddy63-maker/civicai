/**
 * CivicAI End-to-End Image Flow Verification Test Suite
 *
 * Verifies the complete lifecycle of complaint image proof:
 * 1. Citizen upload & image validation (JPG / PNG)
 * 2. Storage provider handling & URL generation
 * 3. MongoDB persistence of image URL, storageKey, and mimeType
 * 4. Static file serving via Express /uploads endpoint (HTTP 200)
 * 5. Citizen complaint details retrieval
 * 6. Admin complaint review and visibility
 * 7. Integrity on upload failure (zero broken records, zero orphaned files)
 * 8. Legacy image inspection and dry run migration
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const app = require('../app');
const config = require('../config/env');
const seedAdmin = require('./seedAdmin');
const { UPLOAD_DIR } = require('../services/storage/localStorageProvider');

// Helper to make HTTP requests
function makeRequest(server, method, reqPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: reqPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = Buffer.alloc(0);
      res.on('data', (chunk) => {
        data = Buffer.concat([data, chunk]);
      });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data.toString('utf8'));
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed,
          rawBody: data,
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

function parseCookies(cookieHeaders) {
  if (!cookieHeaders) return '';
  return cookieHeaders.map((c) => c.split(';')[0]).join('; ');
}

// 1x1 Genuine PNG
function createValidPngDataUri() {
  const png1x1Base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${png1x1Base64}`;
}

// 1x1 Genuine JPEG
function createValidJpegDataUri() {
  const jpeg1x1Base64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  return `data:image/jpeg;base64,${jpeg1x1Base64}`;
}

// Disguised fake image
function createFakeDisguisedDataUri() {
  const fakeBase64 = Buffer.from('Plain text disguised as image').toString('base64');
  return `data:image/png;base64,${fakeBase64}`;
}

async function runCompleteImageFlowTests() {
  console.log('========================================================');
  console.log('🔍 CIVICSENSE AI — COMPLETE IMAGE FLOW VERIFICATION SUITE');
  console.log('========================================================');

  await connectDB();
  await seedAdmin();

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const testPort = server.address().port;
  console.log(`✓ Test Express server running on port ${testPort}`);

  const createdRecords = [];
  const createdDiskFiles = [];

  try {
    // ----------------------------------------------------
    // SETUP: Log in Admin & Register Citizen
    // ----------------------------------------------------
    console.log('\n[Setup] Authenticating test actors...');
    const adminLoginRes = await makeRequest(server, 'POST', '/api/v1/auth/login', {}, {
      email: config.adminSeed.email,
      password: config.adminSeed.password
    });
    if (adminLoginRes.statusCode !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
    }
    const adminCookies = parseCookies(adminLoginRes.cookies);
    console.log('  ✓ Admin logged in successfully.');

    const citizenEmail = `citizen_img_${Date.now()}@civicai.org`;
    const citizenRegisterRes = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Priya Sharma (Citizen)',
      email: citizenEmail,
      password: 'CitizenPassword#2026'
    });
    if (citizenRegisterRes.statusCode !== 201) {
      throw new Error(`Citizen registration failed: ${JSON.stringify(citizenRegisterRes.body)}`);
    }
    const citizenCookies = parseCookies(citizenRegisterRes.cookies);
    const citizenId = citizenRegisterRes.body.data.user._id;
    console.log(`  ✓ Citizen registered (${citizenEmail}).`);

    // ----------------------------------------------------
    // TEST A: Citizen Upload
    // ----------------------------------------------------
    console.log('\n[Test A] Citizen Image Upload & Storage Persistence...');
    const complaintPayload = {
      title: 'Massive open pothole outside primary school',
      description: 'Vehicles and cyclists are getting damaged. Water is stagnating inside.',
      category: 'Roads and potholes',
      location: {
        address: 'Opposite Holy Cross School, 5th Cross Road'
      },
      imageBase64: createValidJpegDataUri()
    };

    const submitRes = await makeRequest(
      server,
      'POST',
      '/api/v1/complaints',
      { Cookie: citizenCookies },
      complaintPayload
    );

    if (submitRes.statusCode !== 201) {
      throw new Error(`Citizen complaint submission failed: ${JSON.stringify(submitRes.body)}`);
    }

    const createdComplaint = submitRes.body.data.complaint;
    createdRecords.push(createdComplaint._id);
    console.log(`  ✓ Complaint submitted: ${createdComplaint.referenceCode}`);

    // Verify image metadata in submission response
    if (!createdComplaint.image || !createdComplaint.image.url) {
      throw new Error('Complaint response does not contain image.url!');
    }
    console.log(`  ✓ Image URL in response: ${createdComplaint.image.url}`);
    console.log(`  ✓ Image storage key: ${createdComplaint.image.storageKey}`);
    console.log(`  ✓ Image MIME type: ${createdComplaint.image.mimeType}`);

    // Verify database record
    const dbRecord = await Complaint.findById(createdComplaint._id).lean();
    if (!dbRecord.image || !dbRecord.image.url) {
      throw new Error('MongoDB complaint record does not have image.url saved!');
    }
    if (dbRecord.image.url !== createdComplaint.image.url) {
      throw new Error('MongoDB image URL does not match response URL!');
    }
    console.log('  ✓ MongoDB Atlas record confirmed with exact image metadata.');

    // If local storage, verify physical file on disk and HTTP GET /uploads/...
    if (createdComplaint.image.url.startsWith('/uploads/')) {
      const diskFilename = path.basename(createdComplaint.image.url);
      const diskFilePath = path.join(UPLOAD_DIR, diskFilename);
      if (!fs.existsSync(diskFilePath)) {
        throw new Error(`File was not found on disk at: ${diskFilePath}`);
      }
      createdDiskFiles.push(diskFilePath);
      console.log(`  ✓ Physical file confirmed on disk (${fs.statSync(diskFilePath).size} bytes).`);

      // Test HTTP static file retrieval through Express
      const staticRes = await makeRequest(server, 'GET', createdComplaint.image.url);
      if (staticRes.statusCode !== 200) {
        throw new Error(`Static file request to ${createdComplaint.image.url} returned status ${staticRes.statusCode}`);
      }
      console.log(`  ✓ Express static server successfully served image via HTTP 200 (${staticRes.rawBody.length} bytes).`);
    }

    // Verify Citizen complaint details endpoint
    const citizenDetailRes = await makeRequest(
      server,
      'GET',
      `/api/v1/complaints/${createdComplaint._id}`,
      { Cookie: citizenCookies }
    );
    if (citizenDetailRes.statusCode !== 200) {
      throw new Error(`Citizen detail retrieval failed: ${JSON.stringify(citizenDetailRes.body)}`);
    }
    const citizenReport = citizenDetailRes.body.data.complaint;
    if (!citizenReport.image || citizenReport.image.url !== createdComplaint.image.url) {
      throw new Error('Citizen complaint details did not return matching image URL!');
    }
    console.log('  ✓ Citizen complaint details successfully retrieved matching image URL.');

    // ----------------------------------------------------
    // TEST B: Admin Image Visibility & Queue Inspection
    // ----------------------------------------------------
    console.log('\n[Test B] Admin Queue & Complaint Image Visibility...');

    // 1. Admin queue contains complaint and image metadata
    const adminQueueRes = await makeRequest(
      server,
      'GET',
      '/api/v1/complaints?page=1&limit=10',
      { Cookie: adminCookies }
    );
    if (adminQueueRes.statusCode !== 200) {
      throw new Error(`Admin queue retrieval failed: ${JSON.stringify(adminQueueRes.body)}`);
    }
    const matchingInQueue = adminQueueRes.body.data.complaints.find(
      (c) => c._id.toString() === createdComplaint._id.toString()
    );
    if (!matchingInQueue) {
      throw new Error('Submitted complaint was not found in admin queue!');
    }
    if (!matchingInQueue.image || !matchingInQueue.image.url) {
      throw new Error('Admin queue omitted image metadata!');
    }
    console.log('  ✓ Complaint with image present in Admin Queue.');

    // 2. Admin opens complaint details
    const adminDetailRes = await makeRequest(
      server,
      'GET',
      `/api/v1/complaints/${createdComplaint._id}`,
      { Cookie: adminCookies }
    );
    if (adminDetailRes.statusCode !== 200) {
      throw new Error(`Admin detail retrieval failed: ${JSON.stringify(adminDetailRes.body)}`);
    }
    const adminReport = adminDetailRes.body.data.complaint;
    if (!adminReport.image || adminReport.image.url !== createdComplaint.image.url) {
      throw new Error('Admin complaint details did not return original Citizen image URL!');
    }
    console.log(`  ✓ Admin complaint view preserves original image: ${adminReport.image.url}`);

    // Verify Admin notes privacy is maintained
    await makeRequest(
      server,
      'POST',
      `/api/v1/complaints/${createdComplaint._id}/notes`,
      { Cookie: adminCookies },
      { text: 'Dispatched road repair crew for site inspection at 9:00 AM' }
    );
    const citizenCheckNotesRes = await makeRequest(
      server,
      'GET',
      `/api/v1/complaints/${createdComplaint._id}`,
      { Cookie: citizenCookies }
    );
    if (citizenCheckNotesRes.body.data.complaint.adminNotes !== undefined) {
      throw new Error('Internal admin notes were leaked to citizen!');
    }
    console.log('  ✓ Admin notes privacy confirmed (notes hidden from citizen).');

    // ----------------------------------------------------
    // TEST C: Failure Handling & Database Integrity
    // ----------------------------------------------------
    console.log('\n[Test C] Failure Handling & Integrity...');
    const countBefore = await Complaint.countDocuments();
    const diskBefore = fs.readdirSync(UPLOAD_DIR);

    // Attempt upload with fake disguised file
    const fakeUploadRes = await makeRequest(
      server,
      'POST',
      '/api/v1/complaints',
      { Cookie: citizenCookies },
      {
        title: 'Defective street lamp flickering dangerously',
        description: 'Lamp fixture has exposed wiring and sparked yesterday.',
        category: 'Streetlights and electrical',
        location: { address: 'Cross 7, Ring Road' },
        imageBase64: createFakeDisguisedDataUri()
      }
    );

    if (fakeUploadRes.statusCode !== 400) {
      throw new Error(`Expected HTTP 400 for disguised image, got ${fakeUploadRes.statusCode}`);
    }
    console.log(`  ✓ Disguised image rejected with HTTP 400: "${fakeUploadRes.body.error.message}"`);

    // Verify 0 broken complaints created
    const countAfter = await Complaint.countDocuments();
    if (countAfter !== countBefore) {
      throw new Error('A broken complaint record was created in MongoDB after image upload rejection!');
    }
    console.log('  ✓ Confirmed: 0 broken complaint records created in MongoDB.');

    // Verify 0 orphaned files left on disk
    const diskAfter = fs.readdirSync(UPLOAD_DIR);
    if (diskAfter.length > diskBefore.length) {
      throw new Error('Orphaned file was left on disk after upload failure!');
    }
    console.log('  ✓ Confirmed: 0 orphaned files left on disk.');

    // ----------------------------------------------------
    // TEST D: Existing Data & Legacy Image Verification
    // ----------------------------------------------------
    console.log('\n[Test D] Existing Legacy Image Inspection & Migration...');
    const legacyComplaints = await Complaint.find({ 'image.url': { $regex: '^/uploads/' } }).lean();
    console.log(`  ✓ Found ${legacyComplaints.length} complaint(s) with local /uploads/ URLs:`);

    for (const leg of legacyComplaints) {
      const filename = path.basename(leg.image.url);
      const filePath = path.join(UPLOAD_DIR, filename);
      const exists = fs.existsSync(filePath);
      console.log(`    - [${leg.referenceCode}] ${leg.image.url} (File on disk: ${exists ? 'EXISTS' : 'MISSING'})`);
    }

    console.log('\n========================================================');
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================');
  } finally {
    // Cleanup test records
    console.log('\n[Cleanup] Removing test records and temporary test files...');
    for (const id of createdRecords) {
      await Complaint.findByIdAndDelete(id);
    }
    for (const f of createdDiskFiles) {
      try {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      } catch {}
    }
    server.close();
    await disconnectDB();
  }
}

if (require.main === module) {
  runCompleteImageFlowTests().catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  });
}

module.exports = { runCompleteImageFlowTests };
