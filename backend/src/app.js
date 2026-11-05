import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

// Security & Rate Limiting Middleware
import { globalLimiter } from './middlewares/security.middleware.js';

// Standard Route Imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import chatRoutes from './routes/chat.routes.js';

// Industry Grade Routes from ER
import visitRoutes from './routes/visit.routes.js'; 
import adminRoutes from './routes/admin.routes.js';
import reviewRoutes from './routes/review.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import notificationRoutes from './routes/notification.routes.js';

import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

// Trust reverse proxy (Render, Vercel, Cloudflare, AWS ALB)
// Essential for express-rate-limit to accurately identify client IPs via X-Forwarded-For
app.set('trust proxy', 1);

// 1. HTTP Security Headers (Anti-Clickjacking, XSS Filter, Sniff Protection)
app.use(helmet({
  contentSecurityPolicy: false, // Allows cross-origin assets (maps, Cloudinary, fonts)
  crossOriginEmbedderPolicy: false
}));

// 2. Anti-DDoS Global Rate Limiting
app.use('/api/v1', globalLimiter);

// 3. CORS Configuration
const cleanFrontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '');
const allowedOrigins = [
  cleanFrontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, postman, render health checks)
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    if (
      allowedOrigins.includes(normalizedOrigin) || 
      (cleanFrontendUrl && normalizedOrigin === cleanFrontendUrl) ||
      normalizedOrigin.endsWith('.vercel.app') || 
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked: Origin ${origin} not authorized by Nestify security policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']
}));

// 4. Payload Size Limits (Anti-Buffer Exhaustion DoS)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. NoSQL Injection Sanitization (Removes $ and . operator keys)
app.use(mongoSanitize());

// 6. HTTP Parameter Pollution Protection
app.use(hpp());

// Basic Health Route
app.get('/', (req, res) => res.send('PG-Finder API is running at Industry Grade...'));

// Register Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/chat', chatRoutes);

// Plug in the O2O and Governance layers
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
