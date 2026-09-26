import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';
import { Budget } from '../models/Budget.model';

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

// Date range
const monthRange = (month: string): { start: Date; end: Date } => {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, mon, 1, 0, 0, 0));
  return { start, end };
};

// 1. Monthly Summary
export const getMonthlySummary = async (userId: string, month: string) => {
  const { start, end } = monthRange(month);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  let totalSpent = 0;
  let totalEarned = 0;
  let transactionCount = 0;

  for (const r of result) {
    if (r._id === 'debit') totalSpent = r.total;
    if (r._id === 'credit') totalEarned = r.total;
    transactionCount += r.count;
  }

  return {
    month,
    totalSpent,
    totalEarned,
    net: totalEarned - totalSpent,
    transactionCount,
  };
};

// 2. Category Breakdown
export const getCategoryBreakdown = async (userId: string, month: string) => {
  const { start, end } = monthRange(month);

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        type: 'debit',
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { total: -1 } },
  ]);

  const grandTotal = result.reduce((sum, r) => sum + r.total, 0);

  return result.map((r) => ({
    category: r._id || 'uncategorized',
    total: r.total,
    percentageOfSpend: grandTotal > 0 ? +(r.total / grandTotal * 100).toFixed(2) : 0,
    transactionCount: r.transactionCount,
  }));
};



// 3. Spending Trend 
export const getSpendingTrend = async (
  userId: string,
  monthsBack: number = 6
) => {
  const now = new Date();
  const startMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthsBack - 1), 1)
  );

  const result = await Transaction.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        type: 'debit',
        date: { $gte: startMonth },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
        totalSpent: { $sum: '$amount' },
      },
    },
  ]);

  const map = new Map(result.map((r) => [r._id, r.totalSpent]));

  const trend: Array<{ month: string; totalSpent: number }> = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    );
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    trend.push({ month: key, totalSpent: map.get(key) ?? 0 });
  }

  return trend;
};

// 4. Compare Two Months (per category)
export const compareMonths = async (
  userId: string,
  monthA: string,
  monthB: string
) => {
  const [a, b] = await Promise.all([
    getCategoryBreakdown(userId, monthA),
    getCategoryBreakdown(userId, monthB),
  ]);

  const categories = new Set([
    ...a.map((r) => r.category),
    ...b.map((r) => r.category),
  ]);

  const aMap = new Map(a.map((r) => [r.category, r.total]));
  const bMap = new Map(b.map((r) => [r.category, r.total]));

  return Array.from(categories).map((category) => {
    const monthATotal = aMap.get(category) ?? 0;
    const monthBTotal = bMap.get(category) ?? 0;
    const percentChange =
      monthATotal > 0
        ? +(((monthBTotal - monthATotal) / monthATotal) * 100).toFixed(2)
        : monthBTotal > 0
          ? 100
          : 0;
    return { category, monthATotal, monthBTotal, percentChange };
  });
};

// 5. Top Merchants
export const getTopMerchants = async (
  userId: string,
  month: string,
  limit: number = 5
) => {
  const { start, end } = monthRange(month);

  return Transaction.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        type: 'debit',
        date: { $gte: start, $lt: end },
        merchant: { $ne: null, $exists: true },
      },
    },
    {
      $group: {
        _id: '$merchant',
        totalSpent: { $sum: '$amount' },
        transactionCount: { $sum: 1 },
      },
    },
    { $sort: { totalSpent: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        merchant: '$_id',
        totalSpent: 1,
        transactionCount: 1,
      },
    },
  ]);
};


// 6. Alerts — currently breached budgets this month
export const getAlerts = async (userId: string, month: string) => {
  const budgets = await Budget.find({ userId, month });

  const alerts: Array<{
    category: string;
    percentUsed: number;
    limit: number;
    spent: number;
  }> = [];

  const { start, end } = monthRange(month);

  for (const budget of budgets) {
    const [row] = await Transaction.aggregate([
      {
        $match: {
          userId: toObjectId(userId),
          type: 'debit',
          category: budget.category,
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const spent = row?.total ?? 0;
    const percentUsed =
      budget.monthlyLimit > 0
        ? +((spent / budget.monthlyLimit) * 100).toFixed(2)
        : 0;

    if (percentUsed >= 50) {
      alerts.push({
        category: budget.category,
        percentUsed,
        limit: budget.monthlyLimit,
        spent,
      });
    }
  }

  return alerts.sort((a, b) => b.percentUsed - a.percentUsed);
};