const { GoogleGenAI } = require('@google/genai');
const config = require('../../config/env');

class GeminiService {
  constructor(options = {}) {
    this.apiKey = options.apiKey || config.geminiApiKey;
    this.modelName = options.modelName || config.geminiModel || 'gemini-2.5-flash';
    this.client = null;

    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  /**
   * Check if Gemini API key is configured
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Determine if an error is transient and safe to retry once
   */
  isTransientError(error) {
    if (!error) return false;
    const msg = (error.message || '').toLowerCase();
    const status = error.status || error.statusCode || error.code;

    // Do NOT retry authentication, quota, or client validation errors
    if (status === 400 || status === 401 || status === 403 || status === 429) {
      return false;
    }
    if (msg.includes('quota') || msg.includes('api_key') || msg.includes('permission')) {
      return false;
    }

    // Transient network or server capacity conditions
    if (
      status === 503 ||
      status === 504 ||
      status === 502 ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('socket hang up') ||
      msg.includes('timeout')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Execute content generation with structured JSON schema and timeout
   */
  async generateStructuredContent({
    contents,
    systemInstruction = '',
    responseSchema = null,
    timeoutMs = 20000,
    model = null
  }) {
    if (!this.isConfigured()) {
      const err = new Error('Gemini API key is not configured.');
      err.code = 'NO_API_KEY';
      err.status = 503;
      throw err;
    }

    const targetModel = model || this.modelName;

    const requestConfig = {
      responseMimeType: 'application/json'
    };

    if (systemInstruction) {
      requestConfig.systemInstruction = systemInstruction;
    }

    if (responseSchema) {
      requestConfig.responseSchema = responseSchema;
    }

    const executeCall = async () => {
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          const timeoutErr = new Error(`Gemini request timed out after ${timeoutMs}ms`);
          timeoutErr.code = 'ETIMEDOUT';
          timeoutErr.status = 504;
          reject(timeoutErr);
        }, timeoutMs);
      });

      try {
        const apiPromise = this.client.models.generateContent({
          model: targetModel,
          contents,
          config: requestConfig
        });

        const response = await Promise.race([apiPromise, timeoutPromise]);
        clearTimeout(timeoutHandle);
        return response;
      } catch (err) {
        clearTimeout(timeoutHandle);
        throw err;
      }
    };

    // Execute with maximum 1 transient retry
    try {
      const res = await executeCall();
      return this.parseJsonResponse(res.text);
    } catch (err) {
      if (this.isTransientError(err)) {
        // Wait 1.5s before a single transient retry
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const retryRes = await executeCall();
        return this.parseJsonResponse(retryRes.text);
      }
      throw err;
    }
  }

  /**
   * Parse JSON safely from model response
   */
  parseJsonResponse(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Model returned empty response text.');
    }

    let cleaned = rawText.trim();
    // Strip markdown code fences if model wrapped response in ```json ... ```
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }

    try {
      return JSON.parse(cleaned);
    } catch (parseErr) {
      const err = new Error(`Malformed JSON output from model: ${parseErr.message}`);
      err.code = 'MALFORMED_JSON';
      err.rawText = rawText;
      throw err;
    }
  }
}

// Export default singleton and class for testing/mocking
const defaultGeminiService = new GeminiService();

module.exports = {
  GeminiService,
  geminiService: defaultGeminiService
};
