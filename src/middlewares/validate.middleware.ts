
import { Request, Response, NextFunction } from 'express';
import { ZodObject, ZodRawShape, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

export const validate =
  (schema: ZodObject<ZodRawShape>, source: Source = 'body') =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      (req as any)[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
        return next(new AppError(`Validation failed — ${issues.join('; ')}`, 400));
      }
      next(err);
    }
  };