/**
 * CivicAI Storage Migration Utility
 *
 * Scans MongoDB Atlas for complaints with local `/uploads/...` images
 * and migrates them to Cloudinary storage.
 *
 * Usage:
 *   Dry run:  node src/utils/migrateStorage.js
 *   Execute:  node src/utils/migrateStorage.js --execute
 */

const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const Complaint = require('../models/Complaint');
const { CloudinaryStorageProvider } = require('../services/storage/cloudinaryStorageProvider');
const config = require('../config/env');
const { UPLOAD_DIR } = require('../services/storage/localStorageProvider');

async function migrateImages() {
  const isDryRun = !process.argv.includes('--execute');

  console.log('========================================================');
  console.log(`📦 CivicAI Image Storage Migration to Cloudinary`);
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (no database changes)' : '🚀 LIVE EXECUTION'}`);
  console.log('========================================================');

  const cloudinaryProvider = new CloudinaryStorageProvider(config.storage?.cloudinary);

  if (!cloudinaryProvider.isConfigured()) {
    if (!isDryRun) {
      console.error('❌ Cloudinary is not configured. Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET.');
      console.error('Please configure Cloudinary in backend/.env before running live migration with --execute.');
      process.exit(1);
    } else {
      console.warn('ℹ️ Cloudinary is not configured in backend/.env. Running dry run in inspection mode.\n');
    }
  }

  await connectDB();

  try {
    // Find all complaints with local upload URLs
    const query = { 'image.url': { $regex: '^/uploads/' } };
    const complaintsToMigrate = await Complaint.find(query);

    console.log(`\nFound ${complaintsToMigrate.length} complaint(s) with local images.\n`);

    let migratedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    for (const complaint of complaintsToMigrate) {
      const filename = path.basename(complaint.image.url);
      const filePath = path.join(UPLOAD_DIR, filename);

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ [${complaint.referenceCode}] Local file not found at ${filePath}. Skipping.`);
        skippedCount++;
        continue;
      }

      console.log(`Processing [${complaint.referenceCode}] - ${filename}...`);

      if (isDryRun) {
        console.log(`  ✓ [DRY RUN] Would upload "${filePath}" to Cloudinary and update record.`);
        migratedCount++;
        continue;
      }

      try {
        const fileBuffer = await fs.promises.readFile(filePath);
        const ext = path.extname(filename).replace('.', '') || 'jpg';
        const mimeType = complaint.image.mimeType || `image/${ext}`;

        const uploadResult = await cloudinaryProvider.upload(fileBuffer, mimeType, ext);

        complaint.image = {
          url: uploadResult.url,
          storageKey: uploadResult.storageKey,
          mimeType: uploadResult.mimeType
        };

        await complaint.save();
        console.log(`  ✅ Successfully migrated to ${uploadResult.url}`);
        migratedCount++;
      } catch (err) {
        console.error(`  ❌ Failed to migrate [${complaint.referenceCode}]:`, err.message);
        failedCount++;
      }
    }

    console.log('\n========================================================');
    console.log('Migration Summary:');
    console.log(`  Total Found:  ${complaintsToMigrate.length}`);
    console.log(`  Migrated:     ${migratedCount}`);
    console.log(`  Skipped:      ${skippedCount}`);
    console.log(`  Failed:       ${failedCount}`);
    console.log('========================================================');
  } catch (err) {
    console.error('❌ Migration script failed:', err.message);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  migrateImages();
}

module.exports = { migrateImages };
