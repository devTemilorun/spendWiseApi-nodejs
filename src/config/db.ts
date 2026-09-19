import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

export const connectDB = async (): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(env.MONGO_URI);
      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${message}`);
      if (attempt === MAX_RETRIES) {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
};

export const getDBStatus = (): string => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
};