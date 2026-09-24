import mongoose, { Document, Schema, Model } from 'mongoose';

export type TransactionType = 'debit' | 'credit';
export type CategorySource = 'auto' | 'manual';
export type TransactionChannel = 'sms' | 'manual' | 'webhook';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: TransactionType;
  bank?: string;
  rawSms?: string;
  merchant?: string;
  category: string;
  categorySource: CategorySource;
  channel: TransactionChannel;
  date: Date;
  smsHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: ['debit', 'credit'], required: true },
    bank: { type: String, trim: true },
    rawSms: { type: String },
    merchant: { type: String, trim: true },
    category: { type: String, default: 'uncategorized', index: true },
    categorySource: {
      type: String,
      enum: ['auto', 'manual'],
      default: 'manual',
    },
    channel: {
      type: String,
      enum: ['sms', 'manual', 'webhook'],
      default: 'manual',
    },
    date: { type: Date, required: true, default: Date.now },
    smsHash: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

export const Transaction: Model<ITransaction> = mongoose.model<ITransaction>(
  'Transaction',
  transactionSchema
);