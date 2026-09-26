import { stringify } from 'csv-stringify';
import { Transaction } from '../models/Transaction.model';

export interface ExportFilters {
  startDate?: Date;
  endDate?: Date;
  category?: string;
}


export const exportTransactionsCSV = async (
  userId: string,
  filters: ExportFilters = {}
): Promise<string> => {
  const query: Record<string, unknown> = { userId };

  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) (query.date as any).$gte = filters.startDate;
    if (filters.endDate) (query.date as any).$lte = filters.endDate;
  }
  if (filters.category) query.category = filters.category;

  const transactions = await Transaction.find(query)
    .sort({ date: -1 })
    .lean();

  return new Promise((resolve, reject) => {
    const rows = transactions.map((t) => ({
      date: t.date ? new Date(t.date).toISOString().slice(0, 10) : '',
      merchant: t.merchant ?? '',
      category: t.category ?? '',
      type: t.type,
      amount: t.amount,
      bank: t.bank ?? '',
      channel: t.channel,
    }));

    stringify(
      rows,
      {
        header: true,
        columns: ['date', 'merchant', 'category', 'type', 'amount', 'bank', 'channel'],
      },
      (err, output) => {
        if (err) return reject(err);
        resolve(output);
      }
    );
  });
};