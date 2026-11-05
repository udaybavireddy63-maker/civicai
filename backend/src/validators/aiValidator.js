const { CIVIC_CATEGORIES, COMPLAINT_PRIORITIES, CIVIC_DEPARTMENTS } = require('../constants');

/**
 * Validate structured AI classification output
 */
function validateComplaintAnalysisOutput(rawOutput) {
  if (!rawOutput || typeof rawOutput !== 'object') {
    throw new Error('AI analysis output must be a valid JSON object');
  }

  const {
    summary,
    suggestedCategory,
    suggestedPriority,
    suggestedDepartment,
    rationale,
    confidence
  } = rawOutput;

  // Validate Summary
  if (!summary || typeof summary !== 'string' || summary.trim().length < 5) {
    throw new Error('AI analysis output missing valid summary (must be at least 5 characters)');
  }

  // Validate Category (Strict against CIVIC_CATEGORIES)
  const trimmedCategory = (suggestedCategory || '').trim();
  if (!CIVIC_CATEGORIES.includes(trimmedCategory)) {
    throw new Error(
      `Invalid AI suggestedCategory "${trimmedCategory}". Must be one of authorized categories: ${CIVIC_CATEGORIES.join(', ')}`
    );
  }

  // Validate Priority (Strict against COMPLAINT_PRIORITIES: LOW, MEDIUM, HIGH)
  const normalizedPriority = (suggestedPriority || '').trim().toUpperCase();
  if (!Object.values(COMPLAINT_PRIORITIES).includes(normalizedPriority)) {
    throw new Error(
      `Invalid AI suggestedPriority "${suggestedPriority}". Must be one of: ${Object.values(COMPLAINT_PRIORITIES).join(', ')}`
    );
  }

  // Validate Department
  let validatedDepartment = (suggestedDepartment || '').trim();
  if (!validatedDepartment) {
    validatedDepartment = 'General Civic Services';
  }

  // Validate Rationale
  const validatedRationale = typeof rationale === 'string' ? rationale.trim() : '';

  // Validate Confidence (Model estimate between 0.0 and 1.0)
  let numericConfidence = typeof confidence === 'number' ? confidence : parseFloat(confidence);
  if (isNaN(numericConfidence) || numericConfidence < 0 || numericConfidence > 1) {
    numericConfidence = 0.85; // Sensible default estimate
  } else {
    numericConfidence = Math.round(numericConfidence * 100) / 100;
  }

  return {
    summary: summary.trim().substring(0, 300),
    suggestedCategory: trimmedCategory,
    suggestedPriority: normalizedPriority,
    suggestedDepartment: validatedDepartment.substring(0, 100),
    rationale: validatedRationale.substring(0, 500),
    confidence: numericConfidence
  };
}

/**
 * Validate duplicate detection output
 */
function validateDuplicateOutput(rawOutput) {
  let list = [];
  if (Array.isArray(rawOutput)) {
    list = rawOutput;
  } else if (rawOutput && Array.isArray(rawOutput.duplicates)) {
    list = rawOutput.duplicates;
  } else if (rawOutput && Array.isArray(rawOutput.similarReports)) {
    list = rawOutput.similarReports;
  } else {
    return [];
  }

  return list
    .filter((item) => item && typeof item === 'object' && item.referenceCode)
    .map((item) => {
      let conf = typeof item.confidence === 'number' ? item.confidence : parseFloat(item.confidence);
      if (isNaN(conf) || conf < 0 || conf > 1) {
        conf = 0.75;
      }
      return {
        referenceCode: String(item.referenceCode).trim(),
        title: item.title ? String(item.title).trim().substring(0, 150) : '',
        similarityReason: item.similarityReason
          ? String(item.similarityReason).trim().substring(0, 300)
          : 'High semantic similarity with existing reported incident.',
        confidence: Math.round(conf * 100) / 100
      };
    });
}

module.exports = {
  validateComplaintAnalysisOutput,
  validateDuplicateOutput
};
