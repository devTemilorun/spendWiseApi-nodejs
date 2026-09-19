import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const start = async (): Promise<void> => {
  await connectDB();

  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`SpendWise API running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Health: http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed. Bye.');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error(' Fatal startup error:', err);
  process.exit(1);
});