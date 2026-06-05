import { sendError } from '../utils/response.js';

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Unauthorized', 401);
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Forbidden', 403);
    }
    
    next();
  };
};
