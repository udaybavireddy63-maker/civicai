const http = require('http');
const mongoose = require('mongoose');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const config = require('../config/env');

let server;
let baseUrl;

function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }

        const cookieHeader = res.headers['set-cookie'];
        let cookie = null;
        if (cookieHeader && cookieHeader.length > 0) {
          cookie = cookieHeader[0].split(';')[0];
        }

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookie,
          body: json
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runDashboardTestSuite() {
  console.log('========================================================');
  console.log('🧪 CivicAI Phase 6 — Dashboard Analytics & Metrics Test');
  console.log('========================================================');

  let adminCookie = null;
  let citizenACookie = null;
  let citizenBCookie = null;

  let testCitizenA = null;
  let testCitizenB = null;
  const createdComplaintIds = [];

  try {
    await connectDB();

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    console.log(`✓ Test server running on port ${port}`);

    // Setup Admin Login
    const adminLoginRes = await makeRequest('POST', '/api/v1/auth/login', {}, {
      email: config.adminSeed.email,
      password: config.adminSeed.password
    });
    if (adminLoginRes.status !== 200 || !adminLoginRes.cookie) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminLoginRes.body)}`);
    }
    adminCookie = adminLoginRes.cookie;
    console.log('  ✓ Admin logged in.');

    // Setup Citizen A
    const timestamp = Date.now();
    const citizenARes = await makeRequest('POST', '/api/v1/auth/register', {}, {
      name: 'Dashboard Citizen Alpha',
      email: `citizen.dash.a.${timestamp}@example.com`,
      password: 'Password#2026'
    });
    citizenACookie = citizenARes.cookie;
    testCitizenA = citizenARes.body.data.user;

    // Setup Citizen B
    const citizenBRes = await makeRequest('POST', '/api/v1/auth/register', {}, {
      name: 'Dashboard Citizen Beta',
      email: `citizen.dash.b.${timestamp}@example.com`,
      password: 'Password#2026'
    });
    citizenBCookie = citizenBRes.cookie;
    testCitizenB = citizenBRes.body.data.user;
    console.log('  ✓ Citizen Alpha & Beta registered.');

    // Seed Complaint Records for Citizen A:
    // 1. SUBMITTED - Roads and potholes (HIGH)
    const c1 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Deep crater on Ring Road',
      description: 'Dangerous pothole damaging vehicles on outer ring road.',
      location: { address: 'Outer Ring Road, KM 14' },
      category: 'Roads and potholes',
      priority: 'HIGH',
      status: 'SUBMITTED',
      aiAnalysis: { status: 'COMPLETED' }
    });
    createdComplaintIds.push(c1._id);

    // 2. IN_PROGRESS - Water supply and leakage (MEDIUM)
    const c2 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Water pipe leak near school',
      description: 'Clean water gushing on pavement.',
      location: { address: '12th Cross, Greenview' },
      category: 'Water supply and leakage',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      department: 'Water Supply & Sewerage Board',
      aiAnalysis: { status: 'COMPLETED' }
    });
    createdComplaintIds.push(c2._id);

    // 3. RESOLVED - Roads and potholes (LOW)
    const c3 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Faded pedestrian crosswalk',
      description: 'Zebra stripes need repainting.',
      location: { address: 'Market Square' },
      category: 'Roads and potholes',
      priority: 'LOW',
      status: 'RESOLVED',
      aiAnalysis: { status: 'COMPLETED' }
    });
    createdComplaintIds.push(c3._id);

    // 4. REJECTED - Streetlights and electrical (MEDIUM)
    const c4 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Private garden lamp broken',
      description: 'Lamp inside private compound.',
      location: { address: 'Private Villa 4' },
      category: 'Streetlights and electrical',
      priority: 'MEDIUM',
      status: 'REJECTED',
      aiAnalysis: { status: 'FAILED' }
    });
    createdComplaintIds.push(c4._id);

    // Seed Complaint for Citizen B:
    // 5. SUBMITTED - Waste and sanitation (HIGH)
    const c5 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenB._id,
      title: 'Garbage dump overflowing',
      description: 'Garbage bin has not been cleared for days.',
      location: { address: 'Sector 9 Market' },
      category: 'Waste and sanitation',
      priority: 'HIGH',
      status: 'SUBMITTED',
      aiAnalysis: { status: 'PENDING' }
    });
    createdComplaintIds.push(c5._id);

    console.log(`  ✓ Seeded 5 test complaints with distinct statuses & categories.`);

    // -------------------------------------------------------------------------
    // Test 1: Citizen Metrics Accuracy (Citizen A)
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Citizen Metrics Accuracy (GET /complaints/metrics/mine)...');
    const citizenMetricsRes = await makeRequest(
      'GET',
      '/api/v1/complaints/metrics/mine',
      { Cookie: citizenACookie }
    );
    if (citizenMetricsRes.status !== 200) {
      throw new Error(`Failed to get citizen metrics: ${JSON.stringify(citizenMetricsRes.body)}`);
    }

    const aMetrics = citizenMetricsRes.body.data.metrics;
    if (aMetrics.total !== 4) {
      throw new Error(`Expected Citizen A total 4, got ${aMetrics.total}`);
    }
    // Active = SUBMITTED (1) + IN_PROGRESS (1) = 2
    if (aMetrics.active !== 2) {
      throw new Error(`Expected Citizen A active 2, got ${aMetrics.active}`);
    }
    if (aMetrics.resolved !== 1) {
      throw new Error(`Expected Citizen A resolved 1, got ${aMetrics.resolved}`);
    }
    if (aMetrics.rejected !== 1) {
      throw new Error(`Expected Citizen A rejected 1, got ${aMetrics.rejected}`);
    }

    // Check category breakdown
    const roadsCategory = aMetrics.categoryBreakdown.find((c) => c.category === 'Roads and potholes');
    if (!roadsCategory || roadsCategory.count !== 2 || roadsCategory.percentage !== 50) {
      throw new Error(`Expected Roads and potholes count 2 (50%), got ${JSON.stringify(roadsCategory)}`);
    }

    // Ensure Citizen B's complaint is NOT in Citizen A's categories
    const wasteCategory = aMetrics.categoryBreakdown.find((c) => c.category === 'Waste and sanitation');
    if (wasteCategory) {
      throw new Error('Citizen B waste complaint leaked into Citizen A category breakdown!');
    }

    // Verify recentReport
    if (!aMetrics.recentReport || !aMetrics.recentReport.referenceCode) {
      throw new Error('Expected recentReport in citizen metrics');
    }

    console.log('  ✓ Citizen A metrics: Total: 4, Active: 2, Resolved: 1, Rejected: 1');
    console.log('  ✓ Category breakdown: Roads (2, 50%), Water (1, 25%), Streetlights (1, 25%)');
    console.log(`  ✓ Recent report linked: ${aMetrics.recentReport.referenceCode}`);

    // -------------------------------------------------------------------------
    // Test 2: Citizen Isolation (Citizen B)
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Citizen Isolation (Citizen B metrics)...');
    const citizenBMetricsRes = await makeRequest(
      'GET',
      '/api/v1/complaints/metrics/mine',
      { Cookie: citizenBCookie }
    );
    const bMetrics = citizenBMetricsRes.body.data.metrics;
    if (bMetrics.total !== 1 || bMetrics.active !== 1 || bMetrics.resolved !== 0) {
      throw new Error(`Expected Citizen B total 1, active 1, got: ${JSON.stringify(bMetrics)}`);
    }
    if (bMetrics.categoryBreakdown[0].category !== 'Waste and sanitation') {
      throw new Error(`Expected Citizen B category Waste and sanitation, got ${bMetrics.categoryBreakdown[0].category}`);
    }
    console.log('  ✓ Citizen B isolated completely: Total 1, Waste and sanitation 100%');

    // -------------------------------------------------------------------------
    // Test 3: Citizen Access Denial to Admin Overview
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Citizen Access Denial to Admin Overview (GET /metrics/overview)...');
    const citizenForbiddenRes = await makeRequest(
      'GET',
      '/api/v1/complaints/metrics/overview',
      { Cookie: citizenACookie }
    );
    if (citizenForbiddenRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden for citizen accessing admin overview, got ${citizenForbiddenRes.status}`);
    }
    console.log('  ✓ Citizen access to admin overview blocked with HTTP 403 Forbidden');

    // -------------------------------------------------------------------------
    // Test 4: Admin Metrics Overview Accuracy Across Entire Database
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Admin Metrics Overview Accuracy (GET /metrics/overview)...');
    const adminMetricsRes = await makeRequest(
      'GET',
      '/api/v1/complaints/metrics/overview',
      { Cookie: adminCookie }
    );
    if (adminMetricsRes.status !== 200) {
      throw new Error(`Failed to get admin overview: ${JSON.stringify(adminMetricsRes.body)}`);
    }

    const adminMetrics = adminMetricsRes.body.data.metrics;
    if (adminMetrics.total < 5) {
      throw new Error(`Expected admin total at least 5, got ${adminMetrics.total}`);
    }

    // Verify status breakdown array exists and has all canonical statuses
    if (!Array.isArray(adminMetrics.statusBreakdown) || adminMetrics.statusBreakdown.length !== 6) {
      throw new Error(`Expected statusBreakdown with 6 canonical statuses, got ${adminMetrics.statusBreakdown?.length}`);
    }

    // Verify priority breakdown
    if (!Array.isArray(adminMetrics.priorityBreakdown) || adminMetrics.priorityBreakdown.length !== 3) {
      throw new Error(`Expected priorityBreakdown with HIGH, MEDIUM, LOW, got ${adminMetrics.priorityBreakdown?.length}`);
    }

    // Verify category breakdown
    const hasRoads = adminMetrics.categoryBreakdown.some((c) => c.category === 'Roads and potholes');
    const hasWaste = adminMetrics.categoryBreakdown.some((c) => c.category === 'Waste and sanitation');
    if (!hasRoads || !hasWaste) {
      throw new Error('Missing expected categories in admin categoryBreakdown');
    }

    // Verify AI Coverage
    if (adminMetrics.aiCoverage.COMPLETED < 3 || adminMetrics.aiCoverage.PENDING < 1) {
      throw new Error(`AI coverage counts mismatch: ${JSON.stringify(adminMetrics.aiCoverage)}`);
    }

    console.log(`  ✓ Admin total queue: ${adminMetrics.total}`);
    console.log(`  ✓ Status breakdown: ${adminMetrics.statusBreakdown.map((s) => `${s.label}: ${s.count}`).join(', ')}`);
    console.log(`  ✓ AI coverage: ${JSON.stringify(adminMetrics.aiCoverage)}`);

    // -------------------------------------------------------------------------
    // Test 5: Recent Activity Ordering & Schema
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Recent Activity Stream Ordering & Schema...');
    const recentActivity = adminMetrics.recentActivity;
    if (!Array.isArray(recentActivity) || recentActivity.length === 0) {
      throw new Error('Recent activity stream is empty');
    }
    if (recentActivity.length > 6) {
      throw new Error(`Recent activity stream exceeded maximum 6 entries: got ${recentActivity.length}`);
    }

    // Ensure descending timestamp ordering
    for (let i = 0; i < recentActivity.length - 1; i++) {
      const t1 = new Date(recentActivity[i].updatedAt).getTime();
      const t2 = new Date(recentActivity[i + 1].updatedAt).getTime();
      if (t1 < t2) {
        throw new Error(`Recent activity is not sorted descending by updatedAt at index ${i}`);
      }
    }

    const firstItem = recentActivity[0];
    if (!firstItem.referenceCode || !firstItem.title || !firstItem.status) {
      throw new Error(`Recent activity item missing required fields: ${JSON.stringify(firstItem)}`);
    }
    console.log(`  ✓ Recent activity correctly ordered descending (Count: ${recentActivity.length})`);
    console.log(`  ✓ Latest item: [${firstItem.referenceCode}] "${firstItem.title}" (${firstItem.status})`);

    // -------------------------------------------------------------------------
    // Test 6: Database Integrity Check (Direct Atlas counts vs API metrics)
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Database Integrity Verification (Mongoose vs API)...');
    const actualDbTotal = await Complaint.countDocuments({});
    if (actualDbTotal !== adminMetrics.total) {
      throw new Error(`DB count (${actualDbTotal}) does not match admin metric total (${adminMetrics.total})`);
    }

    const actualCitizenATotal = await Complaint.countDocuments({ citizenId: testCitizenA._id });
    if (actualCitizenATotal !== aMetrics.total) {
      throw new Error(`DB Citizen A count (${actualCitizenATotal}) does not match API metric (${aMetrics.total})`);
    }
    console.log(`  ✓ Direct Atlas document count (${actualDbTotal}) matches API metrics exactly.`);

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    console.log('\n[Cleanup] Cleaning up test records...');
    await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
    await User.deleteMany({ _id: { $in: [testCitizenA._id, testCitizenB._id] } });
    console.log('  ✓ Test complaints and user accounts deleted.');

    console.log('\n========================================================');
    console.log('🎉 ALL 6 PHASE 6 DASHBOARD METRICS TEST CASES PASSED!');
    console.log('========================================================');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

runDashboardTestSuite();
