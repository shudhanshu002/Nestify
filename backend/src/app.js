import express from 'express';
import cors from 'cors';

// Standard Route Imports - Ensure these files EXIST and have .js
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

// Basic Health Route
app.get('/', (req, res) => res.send('API is running...'));

// Register Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Simple Error Handler (No custom middleware for now to test)
app.use(notFound);

// 3. Global Error Handler (MUST BE LAST)
app.use(errorHandler);

export default app;