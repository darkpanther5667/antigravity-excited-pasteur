import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  const message = err.message || "Internal Server Error";
  const status = err.statusCode || 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(`[ERROR] ${status} - ${message}`);
  }

  return sendError(res, message, status);
};
