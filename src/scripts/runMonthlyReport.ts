import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { runMonthlyReportJob } from '../jobs/monthlyReport.cron';

const run = async () => {
  await connectDB();
  await runMonthlyReportJob();
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});