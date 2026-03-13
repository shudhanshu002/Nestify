export const errorHandler = (err, req, res, next) => {
  // If the error has a statusCode property (set in middleware), use it.
  // Otherwise, check if the response already has a status code.
  // Default to 500.
  let statusCode = err.statusCode || res.statusCode;
  
  if (statusCode === 200) statusCode = 500;

  // Log the error for debugging
  console.error(`[Error Handler] ${err.message} | Status: ${statusCode}`);

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};