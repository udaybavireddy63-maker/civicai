/**
 * CivicAI Storage Adapter Test Suite
 *
 * Verifies:
 * 1. Image validation (magic bytes, MIME type, 5MB limit).
 * 2. Local disk storage provider.
 * 3. Cloudinary storage provider (configuration, upload, errors).
 * 4. Storage adapter backward compatibility.
 * 5. End-to-end complaint creation with image in MongoDB Atlas.
 * 6. Production Safety:
 *    - Rejection of invalid STORAGE_PROVIDER.
 *    - Rejection of missing Cloudinary credentials in production.
 *    - Prevention of silent fallback to local storage.
 * 7. Integrity on upload failure:
 *    - Upload failure leaves zero broken complaints in MongoDB.
 *    - Upload failure leaves zero orphaned files on disk.
 */

const fs = require('fs');
const path = require('path');
const { connectDB, disconnectDB } = require('../config/db');
const { validateEnv } = require('../config/env');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const complaintService = require('../services/complaintService');
const {
  validateBase64Image
} = require('../services/storage/imageValidator');
const {
  LocalStorageProvider,
  UPLOAD_DIR
} = require('../services/storage/localStorageProvider');
const {
  CloudinaryStorageProvider
} = require('../services/storage/cloudinaryStorageProvider');
const {
  saveBase64Image,
  getActiveProvider,
  getActiveStorageProviderName
} = require('../services/storage/imageStorage');

// Helper to generate genuine 1x1 PNG data URI (valid magic bytes: 89 50 4E 47 ...)
function createValidPngDataUri() {
  const png1x1Base64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  return `data:image/png;base64,${png1x1Base64}`;
}

// Helper to generate genuine 1x1 JPEG data URI (valid magic bytes: FF D8 FF ...)
function createValidJpegDataUri() {
  const jpeg1x1Base64 =
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  return `data:image/jpeg;base64,${jpeg1x1Base64}`;
}

// Helper to generate fake/disguised text file
function createFakeDisguisedDataUri() {
  const fakeBase64 = Buffer.from('This is a plain text file pretending to be PNG').toString('base64');
  return `data:image/png;base64,${fakeBase64}`;
}

async function runStorageTests() {
  console.log('========================================================');
  console.log('🧪 CivicAI Storage Adapter & Production Safety Test Suite');
  console.log('========================================================');

  let testUser = null;
  let testComplaint = null;
  const createdTestFiles = [];

  await connectDB();

  try {
    // ----------------------------------------------------
    // Test 1: Content & Magic Bytes Validation
    // ----------------------------------------------------
    console.log('\n[Test 1] Image Magic Bytes & Content Validation...');

    const validPng = validateBase64Image(createValidPngDataUri());
    if (validPng.mimeType !== 'image/png') {
      throw new Error(`Expected image/png, got ${validPng.mimeType}`);
    }
    console.log('  ✓ Genuine PNG correctly verified by magic bytes');

    const validJpeg = validateBase64Image(createValidJpegDataUri());
    if (validJpeg.mimeType !== 'image/jpeg') {
      throw new Error(`Expected image/jpeg, got ${validJpeg.mimeType}`);
    }
    console.log('  ✓ Genuine JPEG correctly verified by magic bytes');

    // Test disguised file rejection
    let fakeRejected = false;
    try {
      validateBase64Image(createFakeDisguisedDataUri());
    } catch (err) {
      fakeRejected = true;
      console.log(`  ✓ Disguised text file rejected: "${err.message}"`);
    }
    if (!fakeRejected) {
      throw new Error('Disguised text file was NOT rejected by magic bytes check!');
    }

    // Test oversized file rejection
    let oversizedRejected = false;
    try {
      const hugeBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0); // 5.5 MB
      const hugeDataUri = `data:image/jpeg;base64,${hugeBuffer.toString('base64')}`;
      validateBase64Image(hugeDataUri);
    } catch (err) {
      oversizedRejected = true;
      console.log(`  ✓ Oversized 5.5MB file rejected: "${err.message}"`);
    }
    if (!oversizedRejected) {
      throw new Error('Oversized image was not rejected!');
    }

    // ----------------------------------------------------
    // Test 2: Local Disk Storage Provider
    // ----------------------------------------------------
    console.log('\n[Test 2] LocalStorageProvider Functionality...');
    const localProvider = new LocalStorageProvider(UPLOAD_DIR);
    const localResult = await localProvider.upload(validPng.buffer, 'image/png', 'png');

    if (!localResult.url.startsWith('/uploads/civic_') || !localResult.url.endsWith('.png')) {
      throw new Error(`Unexpected local storage URL: ${localResult.url}`);
    }

    const localFilePath = path.join(UPLOAD_DIR, path.basename(localResult.url));
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Uploaded file was not created on disk: ${localFilePath}`);
    }
    createdTestFiles.push(localFilePath);
    console.log(`  ✓ File successfully stored on local disk: ${localResult.url}`);

    await localProvider.delete(localResult.storageKey);
    if (fs.existsSync(localFilePath)) {
      throw new Error('Local file was not deleted by localProvider.delete()');
    }
    console.log('  ✓ Local file successfully cleaned up via delete()');

    // ----------------------------------------------------
    // Test 3: Cloudinary Storage Provider Structure & Safety
    // ----------------------------------------------------
    console.log('\n[Test 3] CloudinaryStorageProvider Configuration & Error Safety...');
    const unconfiguredCloudinary = new CloudinaryStorageProvider({ cloudName: '', apiKey: '', apiSecret: '' });
    if (unconfiguredCloudinary.isConfigured()) {
      throw new Error('Empty Cloudinary provider reported as configured!');
    }
    console.log('  ✓ Unconfigured Cloudinary provider correctly reports isConfigured() = false');

    let unconfiguredErrorCaught = false;
    try {
      await unconfiguredCloudinary.upload(validPng.buffer, 'image/png', 'png');
    } catch (err) {
      unconfiguredErrorCaught = true;
      console.log(`  ✓ Missing credentials safely caught without leaking secrets: "${err.message}"`);
    }
    if (!unconfiguredErrorCaught) {
      throw new Error('Unconfigured Cloudinary upload did not reject!');
    }

    const configuredCloudinary = new CloudinaryStorageProvider({
      cloudName: 'test-cloud',
      apiKey: 'test-key',
      apiSecret: 'test-secret'
    });
    if (!configuredCloudinary.isConfigured()) {
      throw new Error('Provided credentials failed isConfigured() check');
    }
    console.log('  ✓ Configured Cloudinary credentials recognized');

    // ----------------------------------------------------
    // Test 4: Storage Adapter Backward Compatibility
    // ----------------------------------------------------
    console.log('\n[Test 4] Storage Adapter & Backward Compatibility...');

    // Existing local URL pass-through
    const existingUrl = '/uploads/civic_existing_photo_123.jpg';
    const passThroughResult = await saveBase64Image(existingUrl);
    if (passThroughResult.url !== existingUrl) {
      throw new Error(`Expected pass-through ${existingUrl}, got ${passThroughResult.url}`);
    }
    console.log('  ✓ Existing /uploads/... URLs preserved with zero mutation');

    const activeProviderName = getActiveStorageProviderName();
    console.log(`  ✓ Active storage provider: ${activeProviderName}`);

    // Upload via unified saveBase64Image
    const adapterResult = await saveBase64Image(createValidJpegDataUri());
    if (!adapterResult.url || !adapterResult.storageKey) {
      throw new Error('Adapter result missing url or storageKey');
    }
    if (adapterResult.url.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOAD_DIR, path.basename(adapterResult.url));
      createdTestFiles.push(diskPath);
    }
    console.log(`  ✓ Unified saveBase64Image succeeded: ${adapterResult.url} (${adapterResult.mimeType})`);

    // ----------------------------------------------------
    // Test 5: Production Safety & Fallback Prevention
    // ----------------------------------------------------
    console.log('\n[Test 5] Production Safety: Missing Credentials & Invalid Provider Rejection...');

    // 5A: Rejection of invalid STORAGE_PROVIDER in production
    let invalidProviderCaught = false;
    try {
      validateEnv({
        MONGODB_URI: 'mongodb://localhost:27017/civicai',
        JWT_SECRET: 'a_very_secure_and_long_jwt_secret_for_tests',
        NODE_ENV: 'production',
        STORAGE_PROVIDER: 'unsupported_s3_storage'
      });
    } catch (err) {
      invalidProviderCaught = true;
      console.log(`  ✓ Invalid STORAGE_PROVIDER rejected at startup: "${err.message.split('\n')[1]}"`);
    }
    if (!invalidProviderCaught) {
      throw new Error('Startup did NOT fail when an invalid STORAGE_PROVIDER was supplied in production!');
    }

    // 5B: Rejection of missing Cloudinary credentials in production
    let missingCloudinaryCaught = false;
    try {
      validateEnv({
        MONGODB_URI: 'mongodb://localhost:27017/civicai',
        JWT_SECRET: 'a_very_secure_and_long_jwt_secret_for_tests',
        NODE_ENV: 'production',
        STORAGE_PROVIDER: 'cloudinary',
        CLOUDINARY_CLOUD_NAME: 'my-cloud'
        // Missing API_KEY and API_SECRET
      });
    } catch (err) {
      missingCloudinaryCaught = true;
      console.log(`  ✓ Missing Cloudinary credentials failed production startup: "${err.message.split('\n')[1]}"`);
    }
    if (!missingCloudinaryCaught) {
      throw new Error('Startup did NOT fail when Cloudinary credentials were missing in production!');
    }

    // 5C: Prevention of silent fallback to local storage
    let fallbackPrevented = false;
    try {
      getActiveProvider('cloudinary');
    } catch (err) {
      fallbackPrevented = true;
      console.log(`  ✓ Silent fallback strictly prohibited: "${err.message}"`);
    }
    if (!fallbackPrevented) {
      throw new Error('getActiveProvider unexpectedly fell back to local storage instead of throwing!');
    }

    // 5D: Rejection of invalid provider in getActiveProvider
    let invalidActiveProviderCaught = false;
    try {
      getActiveProvider('fake_provider_not_allowed');
    } catch (err) {
      invalidActiveProviderCaught = true;
      console.log(`  ✓ getActiveProvider rejected invalid provider: "${err.message}"`);
    }
    if (!invalidActiveProviderCaught) {
      throw new Error('getActiveProvider did not reject an invalid provider name!');
    }

    // ----------------------------------------------------
    // Test 6: Upload Failure Integrity Verification
    // ----------------------------------------------------
    console.log('\n[Test 6] Integrity Verification on Upload Failure...');

    testUser = await User.create({
      name: 'Storage Integrity Citizen',
      email: `integrity_${Date.now()}@civicai.org`,
      passwordHash: 'dummy_hash_for_test',
      role: 'CITIZEN'
    });

    const initialComplaintCount = await Complaint.countDocuments();
    const diskFilesBefore = fs.readdirSync(UPLOAD_DIR);

    // Attempt to submit complaint with an invalid disguised image
    let uploadFailureCaught = false;
    try {
      await complaintService.createComplaint(testUser._id, {
        title: 'Broken Streetlamp Outside Community Park',
        description: 'Streetlamp is completely broken and sparking during rainfall.',
        category: 'Streetlights and electrical',
        location: { address: 'Park Avenue 4th cross' },
        imageBase64: createFakeDisguisedDataUri()
      });
    } catch (err) {
      uploadFailureCaught = true;
      console.log(`  ✓ Create complaint rejected on upload failure: "${err.message}"`);
    }

    if (!uploadFailureCaught) {
      throw new Error('Complaint submission with invalid image unexpectedly succeeded!');
    }

    const complaintCountAfter = await Complaint.countDocuments();
    if (complaintCountAfter !== initialComplaintCount) {
      throw new Error('A broken complaint record was created in MongoDB after upload failure!');
    }
    console.log('  ✓ Verified 0 broken complaint records created in MongoDB Atlas on upload failure');

    const diskFilesAfter = fs.readdirSync(UPLOAD_DIR);
    if (diskFilesAfter.length > diskFilesBefore.length) {
      throw new Error('An orphaned file was left on disk after upload failure!');
    }
    console.log('  ✓ Verified 0 orphaned files left on disk after upload failure');

    // ----------------------------------------------------
    // Test 7: End-to-End Successful Complaint with Image
    // ----------------------------------------------------
    console.log('\n[Test 7] End-to-End Successful Complaint Creation with Valid Image...');

    testComplaint = await complaintService.createComplaint(testUser._id, {
      title: 'Water Pipe Burst Near Metro Station',
      description: 'Major water leakage flooding the sidewalk and street near pillar 12.',
      category: 'Water supply and leakage',
      location: { address: 'MG Road Metro Station Pillar 12' },
      imageBase64: createValidPngDataUri()
    });

    if (!testComplaint.image || !testComplaint.image.url) {
      throw new Error('Complaint was created without image data!');
    }
    if (!testComplaint.image.mimeType.startsWith('image/')) {
      throw new Error(`Invalid complaint image MIME type: ${testComplaint.image.mimeType}`);
    }

    if (testComplaint.image.url.startsWith('/uploads/')) {
      const diskPath = path.join(UPLOAD_DIR, path.basename(testComplaint.image.url));
      createdTestFiles.push(diskPath);
    }

    console.log(`  ✓ Complaint created with reference: ${testComplaint.referenceCode}`);
    console.log(`  ✓ Image stored: ${testComplaint.image.url} (Storage key: ${testComplaint.image.storageKey})`);

    // Verify detail retrieval preserves image URL
    const retrieved = await complaintService.getComplaintById(testComplaint._id, testUser);
    if (!retrieved.image || retrieved.image.url !== testComplaint.image.url) {
      throw new Error('Complaint detail query did not return matching image URL!');
    }
    console.log('  ✓ Complaint detail query preserves image URL');

    // ----------------------------------------------------
    // Cleanup
    // ----------------------------------------------------
    console.log('\n[Cleanup] Removing temporary test records and files...');
    if (testComplaint) {
      await Complaint.findByIdAndDelete(testComplaint._id);
    }
    if (testUser) {
      await User.findByIdAndDelete(testUser._id);
    }

    for (const f of createdTestFiles) {
      try {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f);
        }
      } catch (e) {
        // ignore
      }
    }
    console.log('  ✓ Cleaned up test database records and disk files.');

    console.log('\n========================================================');
    console.log('🎉 ALL 7 STORAGE ADAPTER & PRODUCTION SAFETY TESTS PASSED!');
    console.log('========================================================');
  } catch (err) {
    console.error('\n❌ Storage Adapter Test Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  runStorageTests();
}

module.exports = { runStorageTests };
