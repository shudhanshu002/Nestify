import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

import http from 'http';
import { Server } from 'socket.io';
import { initSocket } from './socket.js';

// 1. Create HTTP server (wraps Express)
const server = http.createServer(app);

// 2. Initialize Socket.IO with resilient CORS for Vercel & local environments
const cleanFrontendUrl = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '');
const io = new Server(server, {
  cors: { 
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const normalized = origin.trim().replace(/\/+$/, '');
      if (
        !cleanFrontendUrl || 
        normalized === cleanFrontendUrl || 
        normalized.endsWith('.vercel.app') || 
        normalized.includes('localhost') || 
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }
      return callback(new Error('Socket CORS blocked'));
    },
    credentials: true
  }
});

// 3. Attach socket logic and expose io to express app
initSocket(io);
app.set('io', io);

const PORT = process.env.PORT || 5000;

// 4. Start everything in proper order
const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`\n🚀 PG Finder Backend running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 URL: http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

// 5. Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});
