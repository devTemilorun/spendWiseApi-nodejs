import { checkBudgetThreshold } from '../../src/services/budget.service';
import { Budget } from '../../src/models/Budget.model';
import { Transaction } from '../../src/models/Transaction.model';
import mongoose from 'mongoose';

const userId = new mongoose.Types.ObjectId().toString();
const month = '2026-09';

const seedBudgetAndSpend = async (limit: number, spent: number) => {
  await Budget.create({
    userId,
    category: 'groceries',
    monthlyLimit: limit,
    month,
    alertThresholds: [50, 80, 100],
  });
  await Transaction.create({
    userId,
    amount: spent,
    type: 'debit',
    category: 'groceries',
    channel: 'manual',
    date: new Date('2026-09-15'),
  });
};

describe('checkBudgetThreshold', () => {
  it('returns no breaches at 49%', async () => {
    await seedBudgetAndSpend(10000, 4900);
    const result = await checkBudgetThreshold(userId, 'groceries', month);
    expect(result?.breached).toEqual([]);
  });

  it('returns [50] at exactly 50%', async () => {
    await seedBudgetAndSpend(10000, 5000);
    const result = await checkBudgetThreshold(userId, 'groceries', month);
    expect(result?.breached).toEqual([50]);
  });

  it('returns [50, 80] at 80%', async () => {
    await seedBudgetAndSpend(10000, 8000);
    const result = await checkBudgetThreshold(userId, 'groceries', month);
    expect(result?.breached).toEqual([50, 80]);
  });

  it('returns [50, 80, 100] at 100%', async () => {
    await seedBudgetAndSpend(10000, 10000);
    const result = await checkBudgetThreshold(userId, 'groceries', month);
    expect(result?.breached).toEqual([50, 80, 100]);
  });

  it('returns [50, 80, 100] at 120%', async () => {
    await seedBudgetAndSpend(10000, 12000);
    const result = await checkBudgetThreshold(userId, 'groceries', month);
    expect(result?.breached).toEqual([50, 80, 100]);
  });
});