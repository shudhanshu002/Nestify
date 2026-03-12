import app from "./app";
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

// db connection
connectDB();

app.listen(PORT, () => {
    console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
})