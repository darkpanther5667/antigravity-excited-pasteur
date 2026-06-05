import db from '../models/db.js';
import { sendError } from '../utils/response.js';

const planHierarchy = {
  FREE: 0,
  PRO: 1,
  ELITE: 2
};

export const requirePlan = (minPlan) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return sendError(res, 'Unauthorized', 401);
      }

      console.log('requirePlan middleware called. req.user.id:', req.user.id, 'minPlan:', minPlan);

      // Fetch fresh user data from DB
      const user = await db.user.findUnique({
        where: { id: req.user.id }
      });

      if (!user) {
        return sendError(res, 'User not found', 404);
      }

      // Check plan expiry first
      if (user.plan !== 'FREE' && user.planExpiry) {
        const now = new Date();
        if (now > new Date(user.planExpiry)) {
          return sendError(res, 'Your plan has expired. Please renew.', 403);
        }
      }

      const userPlanValue = planHierarchy[user.plan] || 0;
      const minPlanValue = planHierarchy[minPlan] || 0;

      if (userPlanValue < minPlanValue) {
        return sendError(res, 'This feature requires Pro plan or above', 403);
      }

      // Attach fresh user details to request
      req.dbUser = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
