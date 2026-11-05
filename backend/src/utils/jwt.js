const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config/env');

const COOKIE_NAME = 'civicai_token';
const DEFAULT_EXPIRY = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Sign a JWT token with standard claims and a unique jti identifier
 */
function signToken(payload, expiresIn = DEFAULT_EXPIRY) {
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign(
    {
      ...payload,
      jti
    },
    config.jwtSecret,
    {
      expiresIn
    }
  );
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return null;
  }
}

/**
 * HttpOnly Cookie configuration options
 */
function getAuthCookieOptions() {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  };
}

/**
 * Clear Cookie options
 */
function getClearCookieOptions() {
  const isProduction = config.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/'
  };
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  getAuthCookieOptions,
  getClearCookieOptions
};
