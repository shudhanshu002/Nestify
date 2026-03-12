import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

// route
import authRoutes from './routes/auth.routes.js'

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json()); // body parser




if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//routers
app.use('/api/v1/auth', authRoutes);


app.use(notFound);
app.use(errorHandler);


// health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'active', message: 'PG Finder API is running' });
});

export default app;