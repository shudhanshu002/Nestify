import express from 'express';
import cors from 'cors';

// Standard Route Imports
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import chatRoutes from './routes/chat.routes.js';

//  Industry Grade Routes from ER
import visitRoutes from './routes/visit.routes.js'; 
import adminRoutes from './routes/admin.routes.js';
import reviewRoutes from './routes/review.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import notificationRoutes from './routes/notification.routes.js';

import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

// Middlewares
app.use(cors({
  origin: 'http://localhost:5173', // or true to allow all during dev
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic Health Route
app.get('/', (req, res) => res.send('PG-Finder API is running at Industry Grade...'));

// Register Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/chat', chatRoutes);

// 󾠯 NEW: Plug in the O2O and Governance layers
app.use('/api/v1/visits', visitRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);

app.use('/api/v1/notifications', notificationRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;