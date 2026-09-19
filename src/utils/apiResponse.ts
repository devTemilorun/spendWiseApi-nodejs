import { Response } from 'express';

interface ApiResponseShape<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const apiResponse = <T>(
  res: Response,
  data: T,
  message = 'Success',
  status = 200
): Response => {
  const payload: ApiResponseShape<T> = { success: status < 400, message, data };
  return res.status(status).json(payload);
};