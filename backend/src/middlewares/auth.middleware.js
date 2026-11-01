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

// Middleware to restrict access based on roles (case-insensitive)
export const authorize = (...roles) => {
  const upperRoles = roles.map(r => r.toUpperCase());
  return (req, res, next) => {
    if (!req.user || !upperRoles.includes((req.user.role || '').toUpperCase())) {
      res.status(403);
      return next(new Error(`Role ${req.user?.role} is not authorized to access this route`));
    }
    next();
  };
};

export const isAdmin = (req, res, next) => {
  if (req.user && (req.user.role || '').toUpperCase() === 'ADMIN') {
    next(); // Identity confirmed. Proceed to the controller.
  } else {
    // Access Denied
    res.status(403);
    const error = new Error('Not authorized as an Admin. Matrix access denied.');
    next(error);
  }
};
