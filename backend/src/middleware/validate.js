import { sendError } from '../utils/response.js';

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Parse body, query, and params against the schema
      if (schema.body) {
        req.body = await schema.body.parseAsync(req.body);
      }
      if (schema.query) {
        req.query = await schema.query.parseAsync(req.query);
      }
      if (schema.params) {
        req.params = await schema.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error.name === "ZodError") {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return sendError(res, `Validation failed: ${errorMessages}`, 400);
      }
      next(error);
    }
  };
};
