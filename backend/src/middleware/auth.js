const { verifyToken, COOKIE_NAME } = require('../utils/jwt');
const { isTokenRevoked } = require('../utils/sessionManager');
const User = require('../models/User');

async function authenticate(req, res, next) {
  try {
    // 1. Extract token from HttpOnly cookie or Authorization header
    let token = null;

    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required. Please sign in.'
        }
      });
    }

    // 2. Check server-side session invalidation / revocation
    const revoked = await isTokenRevoked(token);
    if (revoked) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_SESSION_REVOKED',
          message: 'Your session has been logged out. Please sign in again.'
        }
      });
    }

    // 3. Verify JWT signature & expiration
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_TOKEN',
          message: 'Session is invalid or has expired. Please sign in.'
        }
      });
    }

    // 4. Retrieve user from database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_USER_NOT_FOUND',
          message: 'User account not found.'
        }
      });
    }

    // 5. Attach user and raw token to request
    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('[Auth Middleware Error]', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_INTERNAL_ERROR',
        message: 'An error occurred while verifying your session.'
      }
    });
  }
}

module.exports = authenticate;
