import { User, IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { UpdateProfileInput } from '../validators/user.schema';

export const getProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const updateProfile = async (
  userId: string,
  data: UpdateProfileInput
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(userId, data, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const linkBank = async (
  userId: string,
  bank: string
): Promise<IUser> => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { linkedBanks: bank } },
    { new: true, runValidators: true }
  );
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export const deleteAccount = async (userId: string): Promise<void> => {
  const result = await User.findByIdAndDelete(userId);
  if (!result) throw new AppError('User not found', 404);
};