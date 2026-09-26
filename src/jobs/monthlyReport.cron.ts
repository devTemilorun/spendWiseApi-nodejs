import cron from 'node-cron';
import { User } from '../models/User.model';
import { generateMonthlyReport, formatReportAsText } from '../services/report.service';
import { queueNotification } from '../services/notification.service';


const previousMonth = (date: Date): string => {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const runMonthlyReportJob = async (): Promise<void> => {
  const month = previousMonth(new Date());
  console.log(`[CRON] Starting monthly report job for ${month}`);

  const users = await User.find({}, { _id: 1 }).lean();
  let success = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const userId = user._id.toString();
      const report = await generateMonthlyReport(userId, month);

      if (report.summary.transactionCount === 0) continue;

      const text = formatReportAsText(report);
        await queueNotification(userId, 'monthly_report', text, { ...report });
      success++;
    } catch (err) {
      failed++;
      console.error(`[CRON] Report failed for user ${user._id}:`, err);
    }
  }

  console.log(
    `[CRON] Monthly report job done. Sent: ${success}, Failed: ${failed}, Total users: ${users.length}`
  );
};

// Register the cron job — runs 00:05 on the 1st of every month.
export const registerMonthlyReportCron = (): void => {
  cron.schedule(
    '5 0 1 * *',
    () => {
      runMonthlyReportJob().catch((err) =>
        console.error('[CRON] Monthly report job crashed:', err)
      );
    },
    { timezone: 'Africa/Lagos' }
  );

  console.log('Monthly report cron registered (00:05 on the 1st, Africa/Lagos)');
};