import { Budget, IBudget } from '../models/Budget.model';
import { AppError } from '../utils/AppError';
import { SetBudgetInput } from '../validators/budget.schema';

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