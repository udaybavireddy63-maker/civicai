const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for sensitive authentication endpoints (Login & Register)
 * Limits to 20 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again in 15 minutes.'
      }
    });
  }
});

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many requests. Please slow down.'
      }
    });
  }
});

/**
 * AI analysis rate limiter
 */
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Too many AI analysis requests. Please try again shortly.'
      }
    });
  }
});

module.exports = {
  authLimiter,
  generalLimiter,
  aiLimiter
};
