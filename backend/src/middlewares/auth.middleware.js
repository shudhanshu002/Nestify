import jwt from 'jsonwebtoken';
import * as userService from '../services/user.service.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers?.authorization?.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = await userService.findUserById(decoded.id);

      if (!req.user) {
        const error = new Error('Not authorized, user not found');
        error.statusCode = 401; // Attach status
        return next(error);
      }

      return next();
    } catch (err) {
      const error = new Error('Not authorized, token failed');
      error.statusCode = 401;
      return next(error);
    }
  }

  // If no token at all
  const error = new Error('Not authorized, no token');
  error.statusCode = 401;
  return next(error);
};

// Middleware to restrict access based on roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(`Role ${req.user.role} is not authorized to access this route`));
    }
    next();
  };
};

export const isAdmin = (req, res, next) => {
  // 1. Check if user exists (attached by 'protect' middleware)
  // 2. Check if the role is exactly 'ADMIN'
  if (req.user && req.user.role === 'ADMIN') {
    next(); // Identity confirmed. Proceed to the controller.
  } else {
    // Access Denied
    res.status(403);
    const error = new Error('Not authorized as an Admin. Matrix access denied.');
    next(error);
  }
};