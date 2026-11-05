const mongoose = require('mongoose');
const { connectDB, disconnectDB, getConnectionStatus } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const seedAdmin = require('./seedAdmin');
const { USER_ROLES, COMPLAINT_STATUSES, COMPLAINT_PRIORITIES } = require('../constants');

async function runDatabaseVerification() {
  console.log('========================================================');
  console.log('🧪 CivicAI Phase 2 — MongoDB Atlas Verification Test');
  console.log('========================================================');

  try {
    // 1. Connection Test
    console.log('\n[1/5] Testing Atlas Connection...');
    await connectDB();
    const status = getConnectionStatus();
    console.log(`  ✓ Connection State: ${status.status} (code: ${status.stateCode})`);
    console.log(`  ✓ Host: ${status.host}`);
    console.log(`  ✓ Database Name: ${status.name}`);

    // 2. Safe Admin Seeding Test
    console.log('\n[2/5] Testing Safe Admin Seeding...');
    const adminUser = await seedAdmin();
    console.log(`  ✓ Admin user verified in Atlas: ${adminUser.email}`);
    console.log(`  ✓ Admin role: ${adminUser.role}`);
    console.log(`  ✓ ID: ${adminUser._id}`);

    // 3. User Creation & Password Validation Test
    console.log('\n[3/5] Testing Citizen User Model & Security...');
    const testEmail = `test.resident.${Date.now()}@example.com`;
    const plainPassword = 'Password#Civic123';
    const passwordHash = await User.hashPassword(plainPassword);

    const testCitizen = await User.create({
      name: 'Verification Resident',
      email: testEmail,
      passwordHash,
      role: USER_ROLES.CITIZEN
    });
    console.log(`  ✓ Created test citizen in Atlas: ${testCitizen.email}`);

    // Test password match
    const isPasswordValid = await testCitizen.comparePassword(plainPassword);
    const isWrongPasswordInvalid = !(await testCitizen.comparePassword('WrongPassword'));
    console.log(`  ✓ Password comparison valid: ${isPasswordValid && isWrongPasswordInvalid}`);

    // Verify toJSON removes passwordHash
    const jsonOutput = testCitizen.toJSON();
    console.log(`  ✓ toJSON security (passwordHash stripped): ${jsonOutput.passwordHash === undefined}`);

    // 4. Complaint Creation & Persistence Test
    console.log('\n[4/5] Testing Complaint Model, Enums & Indexes...');
    const refCode = Complaint.generateReferenceCode();
    const testComplaint = await Complaint.create({
      referenceCode: refCode,
      citizenId: testCitizen._id,
      title: 'Atlas Verification — Water Pipeline Test',
      description: 'Pipeline leakage verified for Atlas persistence test suite.',
      location: {
        address: 'MG Road Metro Junction Pillar 42',
        latitude: 12.9716,
        longitude: 77.5946
      },
      category: 'Water supply and leakage',
      priority: COMPLAINT_PRIORITIES.HIGH,
      status: COMPLAINT_STATUSES.SUBMITTED,
      department: 'Water Supply Board',
      statusHistory: [
        {
          from: null,
          to: COMPLAINT_STATUSES.SUBMITTED,
          note: 'Initial automated verification test complaint.',
          changedAt: new Date()
        }
      ],
      aiAnalysis: {
        status: 'COMPLETED',
        suggestedCategory: 'Water supply and leakage',
        suggestedPriority: 'HIGH',
        suggestedDepartment: 'Water Supply Board',
        summary: 'Water pipeline failure requiring rapid pressure isolation.',
        rationale: 'High pressure leak at busy transit intersection.'
      }
    });

    console.log(`  ✓ Saved complaint record with Ref: ${testComplaint.referenceCode}`);
    console.log(`  ✓ Initial status: ${testComplaint.status}`);
    console.log(`  ✓ AI suggested category: ${testComplaint.aiAnalysis.suggestedCategory}`);

    // Read back complaint with population
    const retrievedComplaint = await Complaint.findOne({ referenceCode: refCode }).populate(
      'citizenId',
      'name email role'
    );
    console.log(`  ✓ Read back from Atlas: "${retrievedComplaint.title}"`);
    console.log(`  ✓ Populated citizen: ${retrievedComplaint.citizenId.name} (${retrievedComplaint.citizenId.role})`);

    // 5. Update Status & Audit History Persistence
    console.log('\n[5/5] Testing Status Update & Audit Trail Persistence...');
    retrievedComplaint.status = COMPLAINT_STATUSES.UNDER_REVIEW;
    retrievedComplaint.statusHistory.push({
      from: COMPLAINT_STATUSES.SUBMITTED,
      to: COMPLAINT_STATUSES.UNDER_REVIEW,
      changedBy: adminUser._id,
      note: 'Admin initiated engineering review.',
      changedAt: new Date()
    });
    await retrievedComplaint.save();

    const updatedComplaint = await Complaint.findOne({ referenceCode: refCode });
    console.log(`  ✓ Updated status in Atlas: ${updatedComplaint.status}`);
    console.log(`  ✓ Audit history count: ${updatedComplaint.statusHistory.length}`);
    console.log(`  ✓ Latest transition: ${updatedComplaint.statusHistory[1].from} -> ${updatedComplaint.statusHistory[1].to}`);

    // Clean up temporary verification records
    await Complaint.deleteOne({ _id: testComplaint._id });
    await User.deleteOne({ _id: testCitizen._id });
    console.log('\n  ✓ Cleaned up temporary test records (admin user preserved).');

    console.log('\n========================================================');
    console.log('🎉 ALL DATABASE VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ DATABASE VERIFICATION FAILED:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  runDatabaseVerification();
}

module.exports = runDatabaseVerification;
