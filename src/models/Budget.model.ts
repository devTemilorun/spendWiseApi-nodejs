import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  category: string;
  monthlyLimit: number;
  month: string; 
  alertThresholds: number[]; 
  lastAlertedThreshold?: number; 
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: { type: String, required: true, trim: true, lowercase: true },
    monthlyLimit: { type: Number, required: true, min: 0 },
    month: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
    },
    alertThresholds: { type: [Number], default: [50, 80, 100] },
    lastAlertedThreshold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1, month: 1 }, { unique: true });

export const Budget: Model<IBudget> = mongoose.model<IBudget>(
  'Budget',
  budgetSchema
);