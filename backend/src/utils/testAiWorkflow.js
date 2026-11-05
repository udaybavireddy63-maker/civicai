const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const { ComplaintAnalysisService } = require('../services/ai/complaintAnalysisService');
const { DuplicateDetectionService } = require('../services/ai/duplicateDetectionService');
const { GeminiService } = require('../services/ai/geminiService');
const {
  validateComplaintAnalysisOutput,
  validateDuplicateOutput
} = require('../validators/aiValidator');
const complaintService = require('../services/complaintService');
const {
  CIVIC_CATEGORIES,
  COMPLAINT_PRIORITIES,
  AI_ANALYSIS_STATUSES
} = require('../constants');

// Mock Gemini Service Helper for deterministic automated test assertions
class MockGeminiService {
  constructor(behavior = 'success', mockData = null) {
    this.behavior = behavior;
    this.mockData = mockData;
  }

  isConfigured() {
    return this.behavior !== 'no_key';
  }

  isTransientError(error) {
    const defaultService = new GeminiService({ apiKey: 'dummy' });
    return defaultService.isTransientError(error);
  }

  async generateStructuredContent({ timeoutMs = 15000 }) {
    if (this.behavior === 'no_key') {
      const err = new Error('Gemini API key is not configured.');
      err.code = 'NO_API_KEY';
      err.status = 503;
      throw err;
    }

    if (this.behavior === 'timeout') {
      const err = new Error(`Gemini request timed out after ${timeoutMs}ms`);
      err.code = 'ETIMEDOUT';
      err.status = 504;
      throw err;
    }

    if (this.behavior === 'quota_exceeded') {
      const err = new Error('Resource has been exhausted (e.g. check quota).');
      err.status = 429;
      err.code = 'RESOURCE_EXHAUSTED';
      throw err;
    }

    if (this.behavior === 'invalid_category') {
      return {
        summary: 'Pothole on main street',
        suggestedCategory: 'SuperFakeCategoryNotAllowed',
        suggestedPriority: 'HIGH',
        suggestedDepartment: 'Roads & Asphalt Maintenance',
        rationale: 'Severe road hazard.',
        confidence: 0.95
      };
    }

    if (this.behavior === 'invalid_priority') {
      return {
        summary: 'Pothole on main street',
        suggestedCategory: 'Roads and potholes',
        suggestedPriority: 'CRITICAL_MAX_URGENT',
        suggestedDepartment: 'Roads & Asphalt Maintenance',
        rationale: 'Severe road hazard.',
        confidence: 0.95
      };
    }

    if (this.behavior === 'duplicate_match') {
      return {
        duplicates: [
          {
            referenceCode: this.mockData?.referenceCode || 'CV-EXISTING-1',
            title: 'Existing deep pothole on MG Road',
            similarityReason: 'Both complaints report the exact same road defect on MG Road.',
            confidence: 0.92
          }
        ]
      };
    }

    if (this.behavior === 'no_duplicate') {
      return {
        duplicates: []
      };
    }

    // Default valid success output
    return (
      this.mockData || {
        summary: 'Dangerous open trench on main road.',
        suggestedCategory: 'Roads and potholes',
        suggestedPriority: 'HIGH',
        suggestedDepartment: 'Roads & Asphalt Maintenance',
        rationale: 'Poses an immediate safety hazard for vehicular traffic.',
        confidence: 0.93
      }
    );
  }
}

async function runAiTestSuite() {
  console.log('========================================================');
  console.log('🧪 CivicAI Phase 5 — AI Intelligence Test Suite');
  console.log('========================================================');

  let testCitizenA = null;
  let testCitizenB = null;
  let testAdmin = null;
  const createdComplaintIds = [];

  try {
    await connectDB();

    // Setup Test Users
    testCitizenA = await User.create({
      name: 'AI Citizen Alpha',
      email: `citizen.ai.a.${Date.now()}@example.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyza1234567890',
      role: 'CITIZEN'
    });

    testCitizenB = await User.create({
      name: 'AI Citizen Beta',
      email: `citizen.ai.b.${Date.now()}@example.com`,
      passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyza1234567890',
      role: 'CITIZEN'
    });

    testAdmin = await User.findOne({ role: 'ADMIN' });
    if (!testAdmin) {
      testAdmin = await User.create({
        name: 'AI Admin Officer',
        email: `admin.ai.${Date.now()}@example.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyza1234567890',
        role: 'ADMIN'
      });
    }

    // -------------------------------------------------------------------------
    // Test 1: Successful Gemini Analysis & Persistence
    // -------------------------------------------------------------------------
    console.log('\n[Test 1] Successful Gemini Analysis & Output Persistence...');
    const complaint1 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Large sinkhole forming near bus terminus',
      description: 'The asphalt has caved in and traffic is blocked on the left lane.',
      location: { address: 'Sector 4, Central Bus Terminus' },
      category: 'Roads and potholes',
      priority: 'MEDIUM',
      status: 'SUBMITTED',
      aiAnalysis: { status: 'PENDING' }
    });
    createdComplaintIds.push(complaint1._id);

    const mockAiService = new MockGeminiService('success');
    const mockDupDetector = new DuplicateDetectionService(new MockGeminiService('no_duplicate'));
    const analysisService = new ComplaintAnalysisService(mockAiService, mockDupDetector);

    const analyzedComplaint1 = await analysisService.analyzeAndPersist(complaint1._id);
    if (analyzedComplaint1.aiAnalysis.status !== AI_ANALYSIS_STATUSES.COMPLETED) {
      throw new Error(`Expected status COMPLETED, got ${analyzedComplaint1.aiAnalysis.status}`);
    }
    if (analyzedComplaint1.aiAnalysis.suggestedPriority !== 'HIGH') {
      throw new Error(`Expected suggestedPriority HIGH, got ${analyzedComplaint1.aiAnalysis.suggestedPriority}`);
    }
    if (analyzedComplaint1.aiAnalysis.suggestedCategory !== 'Roads and potholes') {
      throw new Error(`Expected suggestedCategory Roads and potholes, got ${analyzedComplaint1.aiAnalysis.suggestedCategory}`);
    }
    if (!analyzedComplaint1.aiAnalysis.summary || analyzedComplaint1.aiAnalysis.confidence !== 0.93) {
      throw new Error('Analysis summary or confidence did not match expected mock output');
    }
    console.log('  ✓ Gemini analysis succeeded and persisted to MongoDB Atlas (Status: COMPLETED)');
    console.log(`  ✓ Suggested Priority: ${analyzedComplaint1.aiAnalysis.suggestedPriority}, Confidence: ${analyzedComplaint1.aiAnalysis.confidence}`);

    // -------------------------------------------------------------------------
    // Test 2: Valid Structured JSON Output Validator
    // -------------------------------------------------------------------------
    console.log('\n[Test 2] Structured JSON Schema Validation...');
    const validJson = {
      summary: 'Water main pipe rupture causing street flooding.',
      suggestedCategory: 'Water supply and leakage',
      suggestedPriority: 'HIGH',
      suggestedDepartment: 'Water Supply & Sewerage Board',
      rationale: 'Disrupts clean drinking water and blocks traffic.',
      confidence: 0.91
    };
    const validatedJson = validateComplaintAnalysisOutput(validJson);
    if (validatedJson.suggestedCategory !== 'Water supply and leakage' || validatedJson.confidence !== 0.91) {
      throw new Error('Valid structured output failed validator');
    }
    console.log('  ✓ Structured JSON output correctly validated against schema & enums');

    // -------------------------------------------------------------------------
    // Test 3: Invalid Category Rejection
    // -------------------------------------------------------------------------
    console.log('\n[Test 3] Invalid Category Rejection...');
    let invalidCatThrown = false;
    try {
      validateComplaintAnalysisOutput({
        summary: 'Pothole on street',
        suggestedCategory: 'InventedAlienCategory',
        suggestedPriority: 'MEDIUM',
        suggestedDepartment: 'Public Works',
        rationale: 'Test',
        confidence: 0.8
      });
    } catch (e) {
      invalidCatThrown = true;
    }
    if (!invalidCatThrown) {
      throw new Error('Expected validator to reject unlisted civic category');
    }

    // Now test through ComplaintAnalysisService (ensure it marks FAILED safely)
    const complaint2 = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Broken electrical cable',
      description: 'Live wire dangling from post',
      location: { address: 'Park Avenue' },
      category: 'Streetlights and electrical',
      aiAnalysis: { status: 'PENDING' }
    });
    createdComplaintIds.push(complaint2._id);

    const badCatAnalysisService = new ComplaintAnalysisService(
      new MockGeminiService('invalid_category'),
      mockDupDetector
    );
    const result2 = await badCatAnalysisService.analyzeAndPersist(complaint2._id);
    if (result2.aiAnalysis.status !== AI_ANALYSIS_STATUSES.FAILED) {
      throw new Error(`Expected FAILED status for invalid category, got ${result2.aiAnalysis.status}`);
    }
    console.log('  ✓ Server strictly rejected invalid civic category (aiAnalysis marked FAILED)');

    // -------------------------------------------------------------------------
    // Test 4: Invalid Priority Rejection
    // -------------------------------------------------------------------------
    console.log('\n[Test 4] Invalid Priority Rejection...');
    let invalidPriThrown = false;
    try {
      validateComplaintAnalysisOutput({
        summary: 'Pothole on street',
        suggestedCategory: 'Roads and potholes',
        suggestedPriority: 'SUPER_URGENT_CRITICAL',
        suggestedDepartment: 'Public Works',
        rationale: 'Test',
        confidence: 0.8
      });
    } catch (e) {
      invalidPriThrown = true;
    }
    if (!invalidPriThrown) {
      throw new Error('Expected validator to reject non-enum priority');
    }

    const badPriAnalysisService = new ComplaintAnalysisService(
      new MockGeminiService('invalid_priority'),
      mockDupDetector
    );
    const result3 = await badPriAnalysisService.analyzeAndPersist(complaint2._id);
    if (result3.aiAnalysis.status !== AI_ANALYSIS_STATUSES.FAILED) {
      throw new Error('Expected FAILED status for invalid priority');
    }
    console.log('  ✓ Server strictly rejected invalid priority (aiAnalysis marked FAILED)');

    // -------------------------------------------------------------------------
    // Test 5: Missing API Key Handling
    // -------------------------------------------------------------------------
    console.log('\n[Test 5] Missing API Key Handling...');
    const noKeyAiService = new MockGeminiService('no_key');
    const noKeyAnalysisService = new ComplaintAnalysisService(noKeyAiService, mockDupDetector);
    const result4 = await noKeyAnalysisService.analyzeAndPersist(complaint2._id);
    if (result4.aiAnalysis.status !== AI_ANALYSIS_STATUSES.FAILED) {
      throw new Error('Expected FAILED status when API key is missing');
    }
    if (!result4.aiAnalysis.error.includes('not configured')) {
      throw new Error('Expected error message regarding unconfigured API key');
    }
    console.log('  ✓ Missing API key handled safely without crashing (Status: FAILED)');

    // -------------------------------------------------------------------------
    // Test 6: Gemini Timeout Handling
    // -------------------------------------------------------------------------
    console.log('\n[Test 6] Gemini Timeout Handling...');
    const timeoutAiService = new MockGeminiService('timeout');
    const timeoutAnalysisService = new ComplaintAnalysisService(timeoutAiService, mockDupDetector);
    const result5 = await timeoutAnalysisService.analyzeAndPersist(complaint2._id);
    if (result5.aiAnalysis.status !== AI_ANALYSIS_STATUSES.FAILED) {
      throw new Error('Expected FAILED status on timeout');
    }
    if (!result5.aiAnalysis.error.includes('timed out')) {
      throw new Error('Expected timeout error message');
    }
    console.log('  ✓ Request timeout handled cleanly (Status: FAILED)');

    // -------------------------------------------------------------------------
    // Test 7: API Quota Error Handling (No Infinite Retries)
    // -------------------------------------------------------------------------
    console.log('\n[Test 7] API Quota Error & Transient Retry Policy...');
    const quotaAiService = new MockGeminiService('quota_exceeded');
    const isTransient = quotaAiService.isTransientError({ status: 429, message: 'Resource has been exhausted' });
    if (isTransient === true) {
      throw new Error('Quota exceeded 429 error must NOT be classified as transient retryable');
    }
    const quotaAnalysisService = new ComplaintAnalysisService(quotaAiService, mockDupDetector);
    const result6 = await quotaAnalysisService.analyzeAndPersist(complaint2._id);
    if (result6.aiAnalysis.status !== AI_ANALYSIS_STATUSES.FAILED) {
      throw new Error('Expected FAILED status on 429 quota error');
    }
    console.log('  ✓ 429 Quota error caught cleanly and prohibited from infinite retries');

    // -------------------------------------------------------------------------
    // Test 8: Complaint Persistence After AI Failure
    // -------------------------------------------------------------------------
    console.log('\n[Test 8] Complaint Data Persistence After AI Failure...');
    const reloadedComplaint2 = await Complaint.findById(complaint2._id);
    if (!reloadedComplaint2) {
      throw new Error('Complaint was unexpectedly deleted after AI failure');
    }
    if (
      reloadedComplaint2.title !== 'Broken electrical cable' ||
      reloadedComplaint2.location.address !== 'Park Avenue' ||
      reloadedComplaint2.status !== 'SUBMITTED'
    ) {
      throw new Error('Complaint fields were corrupted by AI failure');
    }
    console.log('  ✓ Complaint data 100% preserved in MongoDB Atlas after AI failure');

    // -------------------------------------------------------------------------
    // Test 9: Duplicate Complaint Detection (Positive Match)
    // -------------------------------------------------------------------------
    console.log('\n[Test 9] Duplicate Complaint Detection (Positive Match)...');
    // First complaint
    const existingPothole = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenB._id,
      title: 'Huge pothole on MG Road near flyover',
      description: 'Very deep pothole on MG Road causing two-wheelers to slip.',
      location: { address: 'MG Road near Flyover Pillar 24' },
      category: 'Roads and potholes',
      priority: 'HIGH',
      status: 'SUBMITTED'
    });
    createdComplaintIds.push(existingPothole._id);

    // Second complaint referring to the exact same issue
    const newPothole = await Complaint.create({
      referenceCode: Complaint.generateReferenceCode(),
      citizenId: testCitizenA._id,
      title: 'Dangerous crater on MG Road',
      description: 'Deep road crater near pillar 24 flyover, car tyre popped.',
      location: { address: 'MG Road Pillar 24' },
      category: 'Roads and potholes',
      priority: 'MEDIUM',
      status: 'SUBMITTED'
    });
    createdComplaintIds.push(newPothole._id);

    const dupMockGemini = new MockGeminiService('duplicate_match', {
      referenceCode: existingPothole.referenceCode
    });
    const dupDetector = new DuplicateDetectionService(dupMockGemini);
    const duplicateResults = await dupDetector.detectDuplicates(newPothole);

    if (duplicateResults.length === 0) {
      throw new Error('Expected duplicate detector to return matching complaint');
    }
    if (duplicateResults[0].referenceCode !== existingPothole.referenceCode) {
      throw new Error(`Expected matched ref ${existingPothole.referenceCode}, got ${duplicateResults[0].referenceCode}`);
    }
    console.log(`  ✓ Successfully detected duplicate complaint: ${duplicateResults[0].referenceCode}`);
    console.log(`  ✓ Similarity reason: "${duplicateResults[0].similarityReason}"`);

    // -------------------------------------------------------------------------
    // Test 10: No-Match Duplicate Result (Negative Match)
    // -------------------------------------------------------------------------
    console.log('\n[Test 10] Duplicate Detection with No Semantic Matches...');
    const noDupMockGemini = new MockGeminiService('no_duplicate');
    const noDupDetector = new DuplicateDetectionService(noDupMockGemini);
    const noDupResults = await noDupDetector.detectDuplicates(newPothole);

    if (!Array.isArray(noDupResults) || noDupResults.length !== 0) {
      throw new Error(`Expected empty array for non-duplicate, got ${JSON.stringify(noDupResults)}`);
    }
    console.log('  ✓ No-match result returns empty array [] without flagging false positives');

    // -------------------------------------------------------------------------
    // Test 11: Admin Confirmation of AI Suggestions
    // -------------------------------------------------------------------------
    console.log('\n[Test 11] Admin Confirmation of AI Suggestions...');
    // analyzedComplaint1 currently has category: "Roads and potholes", priority: "MEDIUM" (official), and suggestedPriority: "HIGH"
    const confirmed = await complaintService.confirmAiSuggestions(analyzedComplaint1._id, testAdmin, {
      applyCategory: true,
      applyPriority: true,
      applyDepartment: true,
      comment: 'Confirmed via AI evaluation'
    });

    if (confirmed.priority !== 'HIGH') {
      throw new Error(`Expected official priority to become HIGH, got ${confirmed.priority}`);
    }
    if (confirmed.department !== 'Roads & Asphalt Maintenance') {
      throw new Error(`Expected official department Roads & Asphalt Maintenance, got ${confirmed.department}`);
    }
    console.log('  ✓ Admin confirmed AI recommendations: Official priority & department updated');
    console.log(`  ✓ Official Priority: ${confirmed.priority}, Department: ${confirmed.department}`);

    // -------------------------------------------------------------------------
    // Test 12: Citizen Authorization Restrictions
    // -------------------------------------------------------------------------
    console.log('\n[Test 12] Citizen Authorization Restrictions...');
    // Citizen B trying to trigger AI analysis on Citizen A's complaint
    let citizenForbidden = false;
    try {
      await complaintService.triggerAiAnalysis(analyzedComplaint1._id, testCitizenB);
    } catch (err) {
      if (err.status === 403 || err.code === 'FORBIDDEN') {
        citizenForbidden = true;
      }
    }
    if (!citizenForbidden) {
      throw new Error('Citizen B was allowed to trigger AI analysis on Citizen A complaint');
    }
    console.log('  ✓ Citizen access to other citizen AI analysis blocked (HTTP 403 Forbidden)');

    // -------------------------------------------------------------------------
    // Cleanup
    // -------------------------------------------------------------------------
    console.log('\n[Cleanup] Removing temporary test records...');
    await Complaint.deleteMany({ _id: { $in: createdComplaintIds } });
    await User.deleteMany({ _id: { $in: [testCitizenA._id, testCitizenB._id] } });
    console.log('  ✓ Cleaned up test complaints and user accounts.');

    console.log('\n========================================================');
    console.log('🎉 ALL 12 PHASE 5 AI TEST CASES PASSED!');
    console.log('========================================================');
  } catch (err) {
    console.error('\n❌ Test Suite Failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

runAiTestSuite();
