import {
  getMonthlySummary,
  getCategoryBreakdown,
  getTopMerchants,
} from './analytics.service';

export interface MonthlyReport {
  month: string;
  summary: {
    totalSpent: number;
    totalEarned: number;
    net: number;
    transactionCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    percentageOfSpend: number;
    transactionCount: number;
  }>;
  topMerchants: Array<{
    merchant: string;
    totalSpent: number;
    transactionCount: number;
  }>;
  generatedAt: string;
}

export const generateMonthlyReport = async (
  userId: string,
  month: string
): Promise<MonthlyReport> => {
  const [summary, categoryBreakdown, topMerchants] = await Promise.all([
    getMonthlySummary(userId, month),
    getCategoryBreakdown(userId, month),
    getTopMerchants(userId, month, 3),
  ]);

  return {
    month,
    summary: {
      totalSpent: summary.totalSpent,
      totalEarned: summary.totalEarned,
      net: summary.net,
      transactionCount: summary.transactionCount,
    },
    categoryBreakdown,
    topMerchants,
    generatedAt: new Date().toISOString(),
  };
};


export const formatReportAsText = (report: MonthlyReport): string => {
  const { month, summary, categoryBreakdown, topMerchants } = report;

  if (summary.transactionCount === 0) {
    return `No transactions recorded for ${month}.`;
  }

  const topCat = categoryBreakdown[0];
  const topMerchant = topMerchants[0];

  const parts: string[] = [
    `In ${month}, you spent ₦${summary.totalSpent.toLocaleString()} across ${summary.transactionCount} transactions.`,
  ];

  if (topCat) {
    parts.push(
      `Your top category was ${topCat.category} at ₦${topCat.total.toLocaleString()} (${topCat.percentageOfSpend}%).`
    );
  }

  if (topMerchant) {
    parts.push(
      `Your biggest merchant was ${topMerchant.merchant} at ₦${topMerchant.totalSpent.toLocaleString()}.`
    );
  }

  if (summary.totalEarned > 0) {
    parts.push(
      `You earned ₦${summary.totalEarned.toLocaleString()} (net: ₦${summary.net.toLocaleString()}).`
    );
  }

  return parts.join(' ');
};