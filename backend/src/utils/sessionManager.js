const crypto = require('crypto');
const RevokedToken = require('../models/RevokedToken');

// In-memory cache of revoked hashes for O(1) fast lookup
const revokedCache = new Set();

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Invalidate a token genuinely across the backend
 */
async function invalidateToken(rawToken, userId, expiresAtDate = null) {
  if (!rawToken) return;

  const hash = hashToken(rawToken);
  revokedCache.add(hash);

  const expiresAt = expiresAtDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await RevokedToken.findOneAndUpdate(
      { tokenHash: hash },
      {
        tokenHash: hash,
        userId,
        expiresAt,
        reason: 'USER_LOGOUT'
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('⚠️ [SessionManager] Could not persist revoked token to DB:', err.message);
  }
}

/**
 * Check if a token has been revoked
 */
async function isTokenRevoked(rawToken) {
  if (!rawToken) return true;

  const hash = hashToken(rawToken);

  // Check in-memory fast cache first
  if (revokedCache.has(hash)) {
    return true;
  }

  // Check persistent DB
  try {
    const record = await RevokedToken.findOne({ tokenHash: hash });
    if (record) {
      revokedCache.add(hash);
      return true;
    }
  } catch (err) {
    console.error('⚠️ [SessionManager] Could not query revoked tokens:', err.message);
  }

  return false;
}

module.exports = {
  invalidateToken,
  isTokenRevoked
};
