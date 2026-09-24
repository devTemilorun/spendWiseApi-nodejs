import { Transaction, ITransaction } from '../models/Transaction.model';
import { AppError } from '../utils/AppError';
import {
  CreateTransactionInput,
  UpdateTransactionInput,
  ListTransactionsQuery,
} from '../validators/transaction.schema';

export const createManualTransaction = async (
  userId: string,
  data: CreateTransactionInput
): Promise<ITransaction> => {
  const tx = await Transaction.create({
    userId,
    amount: data.amount,
    type: data.type,
    bank: data.bank,
    merchant: data.merchant,
    category: data.category || 'uncategorized',
    categorySource: 'manual',
    channel: 'manual',
    date: data.date || new Date(),
    rawSms: data.rawSms,
  });
  return tx;
};

export const getTransactions = async (
  userId: string,
  filters: ListTransactionsQuery
) => {
  const { page, limit, startDate, endDate, category, type, bank } = filters;

  const query: Record<string, unknown> = { userId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) (query.date as any).$gte = startDate;
    if (endDate) (query.date as any).$lte = endDate;
  }
  if (category) query.category = category;
  if (type) query.type = type;
  if (bank) query.bank = bank;

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Transaction.find(query).sort({ date: -1 }).skip(skip).limit(limit),
    Transaction.countDocuments(query),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTransactionById = async (
  id: string,
  userId: string
): Promise<ITransaction> => {
  const tx = await Transaction.findOne({ _id: id, userId });
  if (!tx) throw new AppError('Transaction not found', 404);
  return tx;
};

export const updateTransaction = async (
  id: string,
  userId: string,
  data: UpdateTransactionInput
): Promise<ITransaction> => {
  const tx = await Transaction.findOneAndUpdate(
    { _id: id, userId },
    { ...data, categorySource: data.category ? 'manual' : undefined },
    { new: true, runValidators: true }
  );
  if (!tx) throw new AppError('Transaction not found', 404);
  return tx;
};

export const deleteTransaction = async (
  id: string,
  userId: string
): Promise<void> => {
  const result = await Transaction.findOneAndDelete({ _id: id, userId });
  if (!result) throw new AppError('Transaction not found', 404);
};