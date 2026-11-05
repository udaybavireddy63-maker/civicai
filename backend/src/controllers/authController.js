const User = require('../models/User');
const { USER_ROLES } = require('../constants');
const { signToken, getAuthCookieOptions, getClearCookieOptions, COOKIE_NAME } = require('../utils/jwt');
const { invalidateToken } = require('../utils/sessionManager');

/**
 * Register a new citizen account
 * Public registration must always create CITIZEN role regardless of client input
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Full name is required.'
        }
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email address is required.'
        }
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address.'
        }
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 8 characters long.'
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'AUTH_EMAIL_EXISTS',
          message: 'An account with this email address already exists.'
        }
      });
    }

    // 3. Hash password
    const passwordHash = await User.hashPassword(password);

    // 4. Create citizen (strictly enforce CITIZEN role, ignore any req.body.role)
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: USER_ROLES.CITIZEN
    });

    // 5. Generate JWT token
    const token = signToken({
      id: newUser._id,
      role: newUser.role
    });

    // 6. Set HttpOnly authentication cookie
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    return res.status(201).json({
      success: true,
      data: {
        user: newUser.toJSON(),
        token
      },
      message: 'Citizen account registered successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate citizen or admin
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both email and password are required.'
        }
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'Invalid email or password.'
        }
      });
    }

    // Generate token
    const token = signToken({
      id: user._id,
      role: user.role
    });

    // Set HttpOnly cookie
    res.cookie(COOKIE_NAME, token, getAuthCookieOptions());

    return res.status(200).json({
      success: true,
      data: {
        user: user.toJSON(),
        token
      },
      message: 'Authentication successful'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Invalidate session and clear auth cookie
 */
async function logout(req, res, next) {
  try {
    const rawToken = req.token || (req.cookies && req.cookies[COOKIE_NAME]);
    const userId = req.user ? req.user._id : null;

    if (rawToken) {
      // Invalidate on the server so the token cannot be reused
      await invalidateToken(rawToken, userId);
    }

    // Clear HttpOnly cookie on client
    res.clearCookie(COOKIE_NAME, getClearCookieOptions());

    return res.status(200).json({
      success: true,
      data: null,
      message: 'Session closed and logged out successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Return currently authenticated user profile
 */
async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: {
      user: req.user.toJSON()
    },
    message: 'User session verified'
  });
}

module.exports = {
  register,
  login,
  logout,
  getMe
};
