import dotenv from 'dotenv';
dotenv.config();
import app from './app.js';
import connectDB from './config/db.js';

// 1. Load env vars first


const PORT = process.env.PORT || 5000;

// 2. Connect to Database
connectDB();

// 3. Listen
const server = app.listen(PORT, () => {
  console.log(`\n🚀 PG Finder Backend running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 URL: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`❌ Error: ${err.message}`);
  server.close(() => process.exit(1));
});