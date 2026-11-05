const config = require('../config/env');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const { USER_ROLES } = require('../constants');

async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = (config.adminSeed.email || 'admin@civicai.org').toLowerCase().trim();
    const adminName = config.adminSeed.name || 'Municipal Administrator';
    const adminPassword = config.adminSeed.password;

    if (!adminPassword) {
      throw new Error('ADMIN_SEED_PASSWORD is not configured in backend/.env');
    }

    // 1. Check if an account already exists with the configured email
    const existingUser = await User.findOne({ email: adminEmail });

    if (existingUser) {
      if (existingUser.role === USER_ROLES.ADMIN) {
        console.log(`ℹ️ [Admin Seeding] Authorized admin account already exists: ${adminEmail} (Role: ADMIN)`);
        return existingUser;
      }

      // If user exists as CITIZEN, do not accidentally convert them
      console.warn(
        `⚠️ [Admin Seeding] Account "${adminEmail}" exists as a resident CITIZEN. Citizen accounts cannot be converted to Admin automatically. Please use a different ADMIN_SEED_EMAIL.`
      );
      return existingUser;
    }

    // 2. Check if any admin account already exists with a different email to prevent duplicates
    const anyAdmin = await User.findOne({ role: USER_ROLES.ADMIN });
    if (anyAdmin) {
      console.log(`ℹ️ [Admin Seeding] An authorized admin account already exists in database: ${anyAdmin.email}.`);
      return anyAdmin;
    }

    // 3. Provision new admin account
    const passwordHash = await User.hashPassword(adminPassword);

    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: USER_ROLES.ADMIN
    });

    console.log(`✅ [Admin Seeding] Successfully provisioned municipal admin account: ${newAdmin.email}`);
    console.log(`🔒 [Admin Seeding] Role: ${newAdmin.role}`);
    return newAdmin;
  } catch (err) {
    console.error('❌ [Admin Seeding Error]:', err.message);
    throw err;
  }
}

// Allow running directly from command line: node src/utils/seedAdmin.js
if (require.main === module) {
  seedAdmin()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await disconnectDB();
      process.exit(1);
    });
}

module.exports = seedAdmin;
