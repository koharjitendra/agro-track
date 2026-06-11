/**
 * Validate request body against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 * @returns Express middleware
 */
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body);
      req.body = parsed; // replace body with parsed (coerced/transformed) data
      next();
    } catch (err) {
      next(err); // Zod errors are caught by the global error handler
    }
  };
};
