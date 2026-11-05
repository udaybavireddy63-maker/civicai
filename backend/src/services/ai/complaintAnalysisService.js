const Complaint = require('../../models/Complaint');
const { geminiService } = require('./geminiService');
const { duplicateDetectionService } = require('./duplicateDetectionService');
const { validateComplaintAnalysisOutput } = require('../../validators/aiValidator');
const {
  CIVIC_CATEGORIES,
  COMPLAINT_PRIORITIES,
  CIVIC_DEPARTMENTS,
  AI_ANALYSIS_STATUSES
} = require('../../constants');

class ComplaintAnalysisService {
  constructor(gemini = geminiService, duplicateDetector = duplicateDetectionService) {
    this.gemini = gemini;
    this.duplicateDetector = duplicateDetector;
  }

  /**
   * Core AI classification method using Gemini with strict schema
   */
  async analyzeComplaintContent({ title, description, location, category }) {
    if (!this.gemini.isConfigured()) {
      const err = new Error('Gemini AI service is not configured with an API key.');
      err.code = 'NO_API_KEY';
      throw err;
    }

    const categoriesList = CIVIC_CATEGORIES.map((c) => `"${c}"`).join(', ');
    const prioritiesList = Object.values(COMPLAINT_PRIORITIES)
      .map((p) => `"${p}"`)
      .join(', ');
    const departmentsList = CIVIC_DEPARTMENTS.map((d) => `"${d}"`).join(', ');

    const systemInstruction = `You are the lead civic issue analysis engine for CivicAI municipal services.
Analyze incoming citizen complaints to provide structured categorization, urgency assessment, and departmental routing recommendations.

STRICT CONSTRAINTS:
1. suggestedCategory MUST be strictly chosen from this exact list: [${categoriesList}]. Do NOT invent or alter categories.
2. suggestedPriority MUST be strictly chosen from: [${prioritiesList}].
   - "HIGH": Urgent safety hazards, immediate danger to life or property, major flooding, gas/hazardous leaks, blocked arterial roads.
   - "MEDIUM": Moderate disruption, potholes on residential roads, uncollected garbage, localized streetlight outages.
   - "LOW": Minor cosmetic issues, non-obstructive debris, park maintenance, faded signage.
3. suggestedDepartment should be selected from: [${departmentsList}].
4. summary should be an objective, clear 1-2 sentence overview of the defect (max 250 characters).
5. rationale should explain why the priority, category, and department were chosen.
6. confidence is a model score estimate from 0.0 to 1.0.

Always output valid JSON conforming strictly to the requested schema.`;

    const userPrompt = `ANALYZE CIVIC COMPLAINT:
Title: ${title || 'Untitled Report'}
Description: ${description || 'No detailed description'}
Reported Location: ${typeof location === 'object' ? location.address || 'Unspecified' : location || 'Unspecified'}
Citizen Selected Category: ${category || 'None provided'}

Provide the structured assessment in JSON.`;

    const responseSchema = {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        suggestedCategory: { type: 'STRING' },
        suggestedPriority: { type: 'STRING' },
        suggestedDepartment: { type: 'STRING' },
        rationale: { type: 'STRING' },
        confidence: { type: 'NUMBER' }
      },
      required: [
        'summary',
        'suggestedCategory',
        'suggestedPriority',
        'suggestedDepartment',
        'rationale',
        'confidence'
      ]
    };

    const rawResult = await this.gemini.generateStructuredContent({
      contents: userPrompt,
      systemInstruction,
      responseSchema,
      timeoutMs: 20000
    });

    // Server-side validation of enums, fields, and lengths
    return validateComplaintAnalysisOutput(rawResult);
  }

  /**
   * Run full analysis and persist updates to MongoDB Atlas
   * Handles failures gracefully without losing complaint data
   */
  async analyzeAndPersist(complaintId) {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error(`Complaint with ID ${complaintId} not found`);
    }

    try {
      // 1. Run AI classification
      const analysisResult = await this.analyzeComplaintContent({
        title: complaint.title,
        description: complaint.description,
        location: complaint.location,
        category: complaint.category
      });

      // 2. Run duplicate detection
      let duplicates = [];
      try {
        duplicates = await this.duplicateDetector.detectDuplicates(complaint);
      } catch (dupErr) {
        console.warn(`[Duplicate Detection] Non-fatal error: ${dupErr.message}`);
      }

      // 3. Persist success status
      complaint.aiAnalysis = {
        status: AI_ANALYSIS_STATUSES.COMPLETED,
        summary: analysisResult.summary,
        suggestedCategory: analysisResult.suggestedCategory,
        suggestedPriority: analysisResult.suggestedPriority,
        suggestedDepartment: analysisResult.suggestedDepartment,
        rationale: analysisResult.rationale,
        confidence: analysisResult.confidence,
        potentialDuplicates: duplicates,
        error: null,
        analyzedAt: new Date()
      };

      await complaint.save();
      return complaint;
    } catch (err) {
      console.error(`❌ [AI Analysis Failed] For complaint ${complaint.referenceCode}:`, err.message);

      // Safe failure state: preserve complaint data, mark FAILED
      complaint.aiAnalysis = {
        status: AI_ANALYSIS_STATUSES.FAILED,
        summary: complaint.aiAnalysis?.summary || '',
        suggestedCategory: complaint.aiAnalysis?.suggestedCategory || '',
        suggestedPriority: complaint.aiAnalysis?.suggestedPriority || '',
        suggestedDepartment: complaint.aiAnalysis?.suggestedDepartment || '',
        rationale: complaint.aiAnalysis?.rationale || '',
        confidence: null,
        potentialDuplicates: complaint.aiAnalysis?.potentialDuplicates || [],
        error: err.message || 'AI analysis unavailable',
        analyzedAt: new Date()
      };

      await complaint.save();
      return complaint;
    }
  }

  /**
   * Non-blocking fire-and-forget analysis for complaint submission
   */
  analyzeComplaintAsync(complaintId) {
    setImmediate(async () => {
      try {
        await this.analyzeAndPersist(complaintId);
      } catch (err) {
        console.error(`[Async AI Analysis Error] Background job for ${complaintId}:`, err.message);
      }
    });
  }

  /**
   * Admin operation: Confirm/adopt AI suggestions onto official fields
   */
  async confirmAiSuggestions(complaintId, adminUser, options = {}) {
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      throw new Error('Complaint not found');
    }

    const { aiAnalysis } = complaint;
    if (!aiAnalysis || aiAnalysis.status !== AI_ANALYSIS_STATUSES.COMPLETED) {
      throw new Error('Complaint does not have completed AI suggestions to confirm');
    }

    const {
      applyCategory = true,
      applyPriority = true,
      applyDepartment = true,
      comment = 'Confirmed AI recommendations'
    } = options;

    let modified = false;

    if (applyCategory && aiAnalysis.suggestedCategory && CIVIC_CATEGORIES.includes(aiAnalysis.suggestedCategory)) {
      complaint.category = aiAnalysis.suggestedCategory;
      modified = true;
    }

    if (
      applyPriority &&
      aiAnalysis.suggestedPriority &&
      Object.values(COMPLAINT_PRIORITIES).includes(aiAnalysis.suggestedPriority)
    ) {
      complaint.priority = aiAnalysis.suggestedPriority;
      modified = true;
    }

    if (applyDepartment && aiAnalysis.suggestedDepartment) {
      complaint.department = aiAnalysis.suggestedDepartment;
      modified = true;
    }

    if (modified) {
      // Record internal admin note of adoption
      complaint.adminNotes.push({
        authorId: adminUser._id,
        text: `[AI Suggestions Adopted] Category: ${complaint.category}, Priority: ${complaint.priority}, Department: ${complaint.department}. Note: ${comment}`,
        createdAt: new Date()
      });

      await complaint.save();
    }

    return complaint;
  }
}

const defaultComplaintAnalysisService = new ComplaintAnalysisService();

module.exports = {
  ComplaintAnalysisService,
  complaintAnalysisService: defaultComplaintAnalysisService
};
