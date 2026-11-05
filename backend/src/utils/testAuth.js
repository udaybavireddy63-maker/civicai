const http = require('http');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const app = require('../app');
const config = require('../config/env');
const seedAdmin = require('./seedAdmin');

// Helper to make HTTP requests against the Express app
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

async function runAuthTests() {
  console.log('========================================================');
  console.log('🧪 CivicAI Phase 3 — Authentication & Security Test Suite');
  console.log('========================================================');

  let server = null;
  const createdTestEmails = [];

  try {
    await connectDB();
    await seedAdmin();

    // Start server on ephemeral port for tests
    server = app.listen(0);
    const port = server.address().port;
    console.log(`✓ Test server running on port ${port}\n`);

    // 1. Citizen Registration Test
    console.log('[Test 1] Citizen Registration & HttpOnly Cookie...');
    const testEmail = `citizen.test.${Date.now()}@example.com`;
    createdTestEmails.push(testEmail);
    const citizenPassword = 'SecurePassword#2026';

    const regRes = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Test Citizen',
      email: testEmail,
      password: citizenPassword
    });

    if (regRes.statusCode !== 201) {
      throw new Error(`Expected 201 Created, got ${regRes.statusCode}: ${JSON.stringify(regRes.body)}`);
    }
    if (!regRes.cookies || !regRes.cookies[0].includes('HttpOnly')) {
      throw new Error('Expected HttpOnly flag in Set-Cookie header');
    }
    if (regRes.body.data.user.role !== 'CITIZEN') {
      throw new Error(`Expected role CITIZEN, got ${regRes.body.data.user.role}`);
    }
    if (regRes.body.data.user.passwordHash !== undefined) {
      throw new Error('SECURITY BREACH: passwordHash was exposed in registration response!');
    }
    console.log('  ✓ Citizen registration succeeded (HTTP 201)');
    console.log('  ✓ HttpOnly cookie issued');
    console.log('  ✓ passwordHash strictly removed from output');

    const citizenCookie = extractCookie(regRes.cookies);

    // 2. Role Tampering Protection Test
    console.log('\n[Test 2] Role Tampering Prevention...');
    const tamperEmail = `tamper.test.${Date.now()}@example.com`;
    createdTestEmails.push(tamperEmail);

    const tamperRes = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Hacker Attempt',
      email: tamperEmail,
      password: 'HackerPassword#123',
      role: 'ADMIN' // Client maliciously requesting ADMIN role
    });

    if (tamperRes.statusCode !== 201) {
      throw new Error(`Tamper registration failed: ${JSON.stringify(tamperRes.body)}`);
    }
    if (tamperRes.body.data.user.role === 'ADMIN') {
      throw new Error('SECURITY VULNERABILITY: User was able to register as ADMIN via public registration!');
    }
    if (tamperRes.body.data.user.role !== 'CITIZEN') {
      throw new Error(`Expected CITIZEN role, got ${tamperRes.body.data.user.role}`);
    }
    console.log('  ✓ Malicious role request rejected: Assigned CITIZEN role strictly');

    // 3. Password Validation Test
    console.log('\n[Test 3] Password Policy Enforcement (< 8 characters)...');
    const shortPassRes = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Short Pass',
      email: `short.${Date.now()}@example.com`,
      password: '123'
    });
    if (shortPassRes.statusCode !== 400) {
      throw new Error(`Expected 400 for short password, got ${shortPassRes.statusCode}`);
    }
    console.log('  ✓ Short password rejected with HTTP 400 validation error');

    // 4. Duplicate Email Test
    console.log('\n[Test 4] Duplicate Email Prevention...');
    const dupRes = await makeRequest(server, 'POST', '/api/v1/auth/register', {}, {
      name: 'Duplicate Citizen',
      email: testEmail,
      password: 'AnotherPassword#123'
    });
    if (dupRes.statusCode !== 409) {
      throw new Error(`Expected 409 Conflict, got ${dupRes.statusCode}`);
    }
    console.log('  ✓ Duplicate registration rejected with HTTP 409 Conflict');

    // 5. Citizen Login Test
    console.log('\n[Test 5] Citizen Login...');
    const loginRes = await makeRequest(server, 'POST', '/api/v1/auth/login', {}, {
      email: testEmail,
      password: citizenPassword
    });
    if (loginRes.statusCode !== 200) {
      throw new Error(`Login failed with status ${loginRes.statusCode}: ${JSON.stringify(loginRes.body)}`);
    }
    if (!loginRes.cookies || !loginRes.cookies[0].includes('HttpOnly')) {
      throw new Error('Expected HttpOnly cookie on login');
    }
    console.log('  ✓ Citizen login succeeded with HttpOnly cookie (HTTP 200)');

    // 6. Admin Login Test
    console.log('\n[Test 6] Admin Login...');
    const adminRes = await makeRequest(server, 'POST', '/api/v1/auth/login', {}, {
      email: config.adminSeed.email,
      password: config.adminSeed.password
    });
    if (adminRes.statusCode !== 200) {
      throw new Error(`Admin login failed: ${JSON.stringify(adminRes.body)}`);
    }
    if (adminRes.body.data.user.role !== 'ADMIN') {
      throw new Error(`Expected ADMIN role, got ${adminRes.body.data.user.role}`);
    }
    const adminCookie = extractCookie(adminRes.cookies);
    console.log(`  ✓ Admin login succeeded (${adminRes.body.data.user.email}, Role: ADMIN)`);

    // 7. Invalid Credentials Test
    console.log('\n[Test 7] Invalid Credentials Handling...');
    const invalidRes = await makeRequest(server, 'POST', '/api/v1/auth/login', {}, {
      email: testEmail,
      password: 'WrongPassword#999'
    });
    if (invalidRes.statusCode !== 401) {
      throw new Error(`Expected 401 for wrong password, got ${invalidRes.statusCode}`);
    }
    console.log('  ✓ Wrong password rejected with HTTP 401 Unauthorized');

    // 8. Session Restoration (/auth/me) Test
    console.log('\n[Test 8] Session Restoration via /auth/me...');
    const meRes = await makeRequest(server, 'GET', '/api/v1/auth/me', {
      Cookie: citizenCookie
    });
    if (meRes.statusCode !== 200) {
      throw new Error(`Expected 200 on /auth/me, got ${meRes.statusCode}: ${JSON.stringify(meRes.body)}`);
    }
    if (meRes.body.data.user.email !== testEmail) {
      throw new Error(`Expected email ${testEmail}, got ${meRes.body.data.user.email}`);
    }
    console.log(`  ✓ Session verified for: ${meRes.body.data.user.email}`);

    // 9. Role Authorization Test: Citizen cannot access Admin API
    console.log('\n[Test 9] Role Authorization Check (Citizen vs Admin API)...');
    const citizenAdminAccess = await makeRequest(server, 'GET', '/api/v1/admin/verify', {
      Cookie: citizenCookie
    });
    if (citizenAdminAccess.statusCode !== 403) {
      throw new Error(`SECURITY BREACH: Citizen accessed admin endpoint! Status: ${citizenAdminAccess.statusCode}`);
    }
    console.log('  ✓ Citizen access to admin endpoint blocked with HTTP 403 Forbidden');

    // Admin accessing Admin API
    const adminAdminAccess = await makeRequest(server, 'GET', '/api/v1/admin/verify', {
      Cookie: adminCookie
    });
    if (adminAdminAccess.statusCode !== 200) {
      throw new Error(`Admin failed to access admin endpoint: status ${adminAdminAccess.statusCode}`);
    }
    console.log('  ✓ Admin access to admin endpoint authorized with HTTP 200 OK');

    // 10. Genuine Session Invalidation & Logout Test
    console.log('\n[Test 10] Genuine Session Invalidation & Logout...');
    const logoutRes = await makeRequest(server, 'POST', '/api/v1/auth/logout', {
      Cookie: citizenCookie
    });
    if (logoutRes.statusCode !== 200) {
      throw new Error(`Logout failed with status ${logoutRes.statusCode}`);
    }
    console.log('  ✓ Logout endpoint succeeded');

    // Now test token reuse prevention: The citizen cookie must now be rejected!
    const reuseRes = await makeRequest(server, 'GET', '/api/v1/auth/me', {
      Cookie: citizenCookie
    });
    if (reuseRes.statusCode !== 401) {
      throw new Error(`SECURITY FLAW: Token was still valid after logout! Status: ${reuseRes.statusCode}`);
    }
    if (reuseRes.body?.error?.code !== 'AUTH_SESSION_REVOKED') {
      throw new Error(`Expected AUTH_SESSION_REVOKED, got: ${JSON.stringify(reuseRes.body)}`);
    }
    console.log('  ✓ Genuine server-side session revocation verified: Reused token rejected with HTTP 401');

    // Clean up test data
    console.log('\n[Cleanup] Removing temporary test citizen accounts...');
    await User.deleteMany({ email: { $in: createdTestEmails } });
    console.log('  ✓ Cleaned up test citizen records.');

    console.log('\n========================================================');
    console.log('🎉 ALL 10 PHASE 3 AUTHENTICATION TESTS PASSED!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ AUTHENTICATION TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
    await disconnectDB();
  }
}

if (require.main === module) {
  runAuthTests();
}

module.exports = runAuthTests;
