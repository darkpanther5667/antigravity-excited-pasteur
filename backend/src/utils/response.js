/**
 * Response Utility Helpers
 */

export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data: data || {},
    error: null
  });
};

export const sendError = (res, message, statusCode = 400) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: message || "An error occurred"
  });
};
