import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import {
  registerMonthlyReportCron,
  stopMonthlyReportCron,
} from './jobs/monthlyReport.cron';

console.log('[boot] server.ts loaded');

const start = async (): Promise<void> => {
  console.log('[boot] start() entered');

  try {
    await connectDB();
    console.log('[boot] connectDB resolved');
  } catch (err) {
    console.error('[boot] connectDB threw:', err);
    process.exit(1);
  }

  try {
    registerMonthlyReportCron();
    console.log('[boot] cron registered');
  } catch (err) {
    console.error('[boot] cron registration failed:', err);
    // non-fatal: continue
  }

  const server = http.createServer(app);

  server.on('error', (err) => {
    console.error('[boot] http server error:', err);
    process.exit(1);
  });

  server.listen(env.PORT, () => {
    console.log(`[boot] SpendWise API running on http://localhost:${env.PORT}`);
    console.log(`[boot] Environment: ${env.NODE_ENV}`);
    console.log(`[boot] Health: http://localhost:${env.PORT}/api/health`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n[boot] ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      try {
        stopMonthlyReportCron();
      } catch (err) {
        console.error('[boot] cron stop failed:', err);
      }
      try {
        await mongoose.connection.close();
      } catch (err) {
        console.error('[boot] mongoose close failed:', err);
      }
      console.log('[boot] Shutdown complete. Bye.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[boot] Forced shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  console.error('[boot] Fatal startup error:', err);
  process.exit(1);
});
