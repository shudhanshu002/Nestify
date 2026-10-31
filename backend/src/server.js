import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import connectDB from './config/db.js';

import http from 'http';
import { Server } from 'socket.io';
import { initSocket } from './socket.js';

// 1. Create HTTP server (wraps Express)
const server = http.createServer(app);

// 2. Initialize Socket.IO
const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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

// 5. Handle unhandled promise rejections (same as before)
process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});
