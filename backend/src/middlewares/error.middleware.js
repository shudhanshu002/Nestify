/**
 * Error Handling Middleware
 * Sanitizes errors to prevent internal server details and DB schema leakage
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode === 200) statusCode = 500;

  let message = err.message || 'Internal Server Error';

  // 1. Mongoose Bad ObjectId (CastError) -> Hide internal model & field names
  if (err.name === 'CastError') {
    message = 'Resource not found or invalid identifier format';
    statusCode = 404;
  }

  // 2. Mongoose Duplicate Key Error (code 11000) -> Sanitize MongoDB raw error message
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
    statusCode = 400;
  }

  // 3. Mongoose Validation Error -> Clean validation messages
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map(e => e.message);
    message = errors.join(', ') || 'Validation error';
    statusCode = 400;
  }

  // 4. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token expired';
    statusCode = 401;
  }

  // 5. Suppress internal stack traces in production (returns null instead of error stack)
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction && process.env.NODE_ENV !== 'test') {
    console.error(`[Error Handler] ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: isProduction ? null : err.stack,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
