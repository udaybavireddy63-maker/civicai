const { USER_ROLES } = require('../constants');

/**
 * Middleware factory to enforce specific user roles
 * @param  {...string} allowedRoles Roles authorized to access the route
 */
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required prior to authorization.'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied. You do not have permission to access this resource.'
        }
      });
    }

    next();
  };
}

const requireAdmin = authorizeRoles(USER_ROLES.ADMIN);
const requireCitizen = authorizeRoles(USER_ROLES.CITIZEN, USER_ROLES.ADMIN); // Admin can view citizen self routes if needed, or strict citizen

module.exports = {
  authorizeRoles,
  requireAdmin,
  requireCitizen
};
