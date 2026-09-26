import { checkBudgetThreshold } from './budget.service';
import { sendBudgetAlert } from './notification.service';
import { Budget } from '../models/Budget.model';


export const evaluateBudgetAlerts = async (
  userId: string,
  category: string,
  date: Date
): Promise<void> => {
  try {
    const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

    const result = await checkBudgetThreshold(userId, category, month);
    if (!result) return;

    const { budget, spent, percentUsed, breached } = result;

    // Find the highest threshold breached that we haven't alerted on yet
    const lastAlerted = budget.lastAlertedThreshold ?? 0;
    const newBreaches = breached.filter((t) => t > lastAlerted);

    if (newBreaches.length === 0) return;

    const highest = newBreaches[newBreaches.length - 1];

    await sendBudgetAlert(userId, {
      category,
      percentUsed,
      limit: budget.monthlyLimit,
      spent,
      thresholdBreached: highest,
    });

    budget.lastAlertedThreshold = highest;
    await budget.save();
  } catch (err) {
    console.error('[evaluateBudgetAlerts] failed:', err);
  }
};