const Complaint = require('../../models/Complaint');
const { geminiService } = require('./geminiService');
const { validateDuplicateOutput } = require('../../validators/aiValidator');

class DuplicateDetectionService {
  constructor(gemini = geminiService) {
    this.gemini = gemini;
  }

  /**
   * Find potentially duplicate or related civic complaints
   * @param {Object} complaint - The target complaint document or plain object
   * @param {Object} options - Additional search criteria
   * @returns {Promise<Array>} List of potential duplicates with reasons
   */
  async detectDuplicates(complaint, options = {}) {
    if (!complaint || !complaint.description) {
      return [];
    }

    try {
      // 1. Retrieve a small, targeted candidate pool from the database (max 6)
      const query = {
        _id: { $ne: complaint._id }
      };

      // Match on same category or address substring if available
      if (complaint.category && complaint.category !== 'Other') {
        query.category = complaint.category;
      }

      // Look back up to 60 days to catch relevant open or recent issues
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: sixtyDaysAgo };

      // Exclude already rejected complaints
      query.status = { $ne: 'REJECTED' };

      const candidateLimit = options.limit || 6;

      const candidates = await Complaint.find(query)
        .select('referenceCode title description category location createdAt status')
        .sort({ createdAt: -1 })
        .limit(candidateLimit)
        .lean();

      if (!candidates || candidates.length === 0) {
        return [];
      }

      // If Gemini is not configured, return empty without throwing
      if (!this.gemini.isConfigured()) {
        return [];
      }

      // 2. Prepare concise prompt for semantic comparison
      const newReportPrompt = `NEW COMPLAINT:
Reference: ${complaint.referenceCode || 'NEW'}
Category: ${complaint.category || 'Unspecified'}
Title: ${complaint.title || ''}
Description: ${complaint.description}
Address: ${complaint.location?.address || 'Not specified'}`;

      const candidateListPrompt = candidates
        .map(
          (c, idx) => `[CANDIDATE ${idx + 1}]
Reference: ${c.referenceCode}
Category: ${c.category}
Title: ${c.title}
Description: ${c.description}
Address: ${c.location?.address || 'Not specified'}`
        )
        .join('\n\n');

      const systemInstruction = `You are a municipal civic services duplicate detector.
Your job is to compare a NEW complaint against a small set of candidate existing complaints to check if they refer to the SAME physical civic incident or location defect (e.g. identical pothole, same burst water pipe, same fallen tree or streetlight outage).

RULES:
- Be strict: Only flag complaints as duplicates if they are genuinely referring to the same physical issue.
- If they are merely the same category but different locations or different incidents, do NOT flag them.
- If none of the candidates match, return an empty array: {"duplicates": []}.
- Never suggest merging or deleting complaints; your analysis is purely advisory for human admins.
- Return valid JSON matching the exact schema.`;

      const responseSchema = {
        type: 'OBJECT',
        properties: {
          duplicates: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                referenceCode: { type: 'STRING' },
                title: { type: 'STRING' },
                similarityReason: { type: 'STRING' },
                confidence: { type: 'NUMBER' }
              },
              required: ['referenceCode', 'similarityReason']
            }
          }
        },
        required: ['duplicates']
      };

      const promptContent = `${newReportPrompt}\n\nEXISTING CANDIDATES:\n${candidateListPrompt}\n\nDetermine if any candidates describe the exact same physical issue. Output JSON.`;

      const rawResult = await this.gemini.generateStructuredContent({
        contents: promptContent,
        systemInstruction,
        responseSchema,
        timeoutMs: 15000
      });

      const validated = validateDuplicateOutput(rawResult);

      // Verify returned reference codes actually exist in the candidate list
      const candidateRefMap = new Map(candidates.map((c) => [c.referenceCode, c.title]));
      const sanitizedDuplicates = validated.filter((d) => {
        if (candidateRefMap.has(d.referenceCode)) {
          if (!d.title) {
            d.title = candidateRefMap.get(d.referenceCode);
          }
          return true;
        }
        return false;
      });

      return sanitizedDuplicates;
    } catch (err) {
      console.warn(`⚠️ [Duplicate Detection] Analysis skipped or failed: ${err.message}`);
      return [];
    }
  }
}

const defaultDuplicateDetectionService = new DuplicateDetectionService();

module.exports = {
  DuplicateDetectionService,
  duplicateDetectionService: defaultDuplicateDetectionService
};
