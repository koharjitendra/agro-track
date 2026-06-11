import { ZodError } from 'zod';

/**
 * Global error handler middleware.
 * Handles Zod validation errors, Mongoose errors, and generic errors.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // ── Zod validation errors ──
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // ── Mongoose validation error ──
  if (err.name === 'ValidationError') {
    const formattedErrors = Object.keys(err.errors).map((key) => ({
      field: key,
      message: err.errors[key].message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // ── Mongoose duplicate key error ──
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `Duplicate value for field: ${field}. This value already exists.`,
    });
  }

  // ── Mongoose cast error (invalid ObjectId, etc.) ──
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
  }

  // ── Generic error ──
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (statusCode === 500) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
