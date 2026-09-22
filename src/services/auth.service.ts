import crypto from 'crypto';
import { User, IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '../validators/auth.schema';

const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token).digest('hex');

const buildTokens = (user: IUser) => {
  const payload = { userId: user._id.toString(), email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  return { accessToken, refreshToken };
};

export const register = async (data: RegisterInput) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError('Email already registered', 409);

  const user = await User.create(data);
  const tokens = buildTokens(user);

  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    ...tokens,
  };
};

export const login = async (data: LoginInput) => {
  const user = await User.findOne({ email: data.email }).select(
    '+password +refreshTokenHash'
  );
  if (!user) throw new AppError('Invalid credentials', 401);

  const isMatch = await user.comparePassword(data.password);
  if (!isMatch) throw new AppError('Invalid credentials', 401);

  const tokens = buildTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    ...tokens,
  };
};

export const refresh = async (token: string) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.userId).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    throw new AppError('Refresh token revoked', 401);
  }

  if (user.refreshTokenHash !== hashToken(token)) {
    throw new AppError('Refresh token does not match', 401);
  }

  const tokens = buildTokens(user);
  user.refreshTokenHash = hashToken(tokens.refreshToken);
  await user.save();

  return tokens;
};

export const logout = async (userId: string) => {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });
  return { message: 'Logged out' };
};

export const changePassword = async (
  userId: string,
  data: ChangePasswordInput
) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  const ok = await user.comparePassword(data.oldPassword);
  if (!ok) throw new AppError('Old password is incorrect', 401);

  user.password = data.newPassword;
  user.refreshTokenHash = undefined as unknown as string;
  await user.save();

  return { message: 'Password updated. Please log in again.' };
};