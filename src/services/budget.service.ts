import { Budget, IBudget } from '../models/Budget.model';
import { AppError } from '../utils/AppError';
import { SetBudgetInput } from '../validators/budget.schema';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.model';

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const monthRange = (month: string) => {
  const [year, mon] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, mon - 1, 1)),
    end: new Date(Date.UTC(year, mon, 1)),
  };
};



export const setBudget = async (
  userId: string,
  data: SetBudgetInput
): Promise<IBudget> => {
  const budget = await Budget.findOneAndUpdate(
    { userId, category: data.category, month: data.month },
    {
      userId,
      category: data.category,
      monthlyLimit: data.monthlyLimit,
      month: data.month,
      alertThresholds: data.alertThresholds,
    },
    { new: true, upsert: true, runValidators: true }
  );
  return budget;
};

export const getBudget = async (
  userId: string,
  category: string,
  month: string
): Promise<IBudget | null> => {
  return Budget.findOne({ userId, category, month });
};

export const listBudgets = async (
  userId: string,
  month: string
): Promise<IBudget[]> => {
  return Budget.find({ userId, month }).sort({ category: 1 });
};

export const deleteBudget = async (
  userId: string,
  id: string
): Promise<void> => {
  const result = await Budget.findOneAndDelete({ _id: id, userId });
  if (!result) throw new AppError('Budget not found', 404);
};





/**
 * Returns { percentUsed, breached: number[] }
 * breached = thresholds crossed (e.g. [50, 80] if at 82%)
 */
export const checkBudgetThreshold = async (
  userId: string,
  category: string,
  month: string
) => {
  const budget = await Budget.findOne({ userId, category, month });
  if (!budget) return null;

  const { start, end } = monthRange(month);

  const [row] = await Transaction.aggregate([
    {
      $match: {
        userId: toObjectId(userId),
        type: 'debit',
        category,
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const spent = row?.total ?? 0;
  const percentUsed =
    budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0;

  const breached = budget.alertThresholds
    .filter((t) => percentUsed >= t)
    .sort((a, b) => a - b);

  return {
    budget,
    spent,
    percentUsed: +percentUsed.toFixed(2),
    breached,
  };
};