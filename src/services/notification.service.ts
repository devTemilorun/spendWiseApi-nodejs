import { Notification, NotificationType } from '../models/Notification.model';

export const queueNotification = async (
  userId: string,
  type: NotificationType,
  message: string,
  meta?: Record<string, unknown>
) => {
  const notification = await Notification.create({
    userId,
    type,
    message,
    meta,
  });
  return notification;
};

//   Send a budget alert.Plug in email / push / SMS 
export const sendBudgetAlert = async (
  userId: string,
  alert: {
    category: string;
    percentUsed: number;
    limit: number;
    spent: number;
    thresholdBreached: number;
  }
) => {
  const formattedMessage = `You have spent ${alert.percentUsed.toFixed(0)}% of your ₦${alert.limit.toLocaleString()} ${alert.category} budget this month.`;

  console.log(
    `[BUDGET ALERT] user=${userId} category=${alert.category} ` +
      `threshold=${alert.thresholdBreached}% used=${alert.percentUsed.toFixed(1)}%`
  );

  return queueNotification(userId, 'budget_alert', formattedMessage, {
    category: alert.category,
    percentUsed: alert.percentUsed,
    limit: alert.limit,
    spent: alert.spent,
    thresholdBreached: alert.thresholdBreached,
  });
};

// Notification Listing
export const listNotifications = async (
  userId: string,
  page: number = 1,
  limit: number = 20
) => {
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId }),
  ]);

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

export const markAsRead = async (userId: string, id: string) => {
  return Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true },
    { new: true }
  );
};