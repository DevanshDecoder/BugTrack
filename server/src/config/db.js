import mongoose from 'mongoose';

// Setup connection lifecycle event listeners
mongoose.connection.on('connected', () => {
  console.log(`[BugTrack DB] Successfully connected to database: '${mongoose.connection.name}' on ${mongoose.connection.host}`);
});

mongoose.connection.on('error', (err) => {
  console.error(`[BugTrack DB Connection Error]: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[BugTrack DB] MongoDB connection lost. Re-establishing connection...');
});

const connectDB = async (retryCount = 0) => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bugtrack';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'bugtrack', // Guarantees all data always lands in 'bugtrack' DB
      serverSelectionTimeoutMS: 10000,
    });
    return conn;
  } catch (error) {
    console.error(`[BugTrack DB Error] Connection attempt failed: ${error.message}`);
    
    // Auto-retry up to 3 times on boot
    if (retryCount < 3) {
      console.log(`[BugTrack DB] Retrying connection (${retryCount + 1}/3) in 3 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return connectDB(retryCount + 1);
    }

    if (process.env.NODE_ENV === 'production') {
      console.error('[BugTrack DB Fatal] Could not connect to MongoDB Atlas in production. Exiting.');
      process.exit(1);
    }
  }
};

export default connectDB;
