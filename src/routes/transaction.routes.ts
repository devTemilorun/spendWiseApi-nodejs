import { Router } from 'express';
import * as txController from '../controllers/transaction.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTransactionSchema,
  updateTransactionSchema,
  listTransactionsQuerySchema,
} from '../validators/transaction.schema';
import { bulkImportLimiter } from '../middlewares/rateLimiter.middleware';
import { bulkImportSchema } from '../validators/transaction.schema';

const router = Router();

router.use(authMiddleware);

router.post(
  '/manual',
  validate(createTransactionSchema),
  txController.createTransaction
);
router.get(
  '/',
  validate(listTransactionsQuerySchema, 'query'),
  txController.listTransactions
);
router.get('/:id', txController.getTransaction);
router.put(
  '/:id',
  validate(updateTransactionSchema),
  txController.updateTransaction
);
router.delete('/:id', txController.deleteTransaction);
router.post(
  '/bulk',
  bulkImportLimiter,
  validate(bulkImportSchema),
  txController.bulkImportTransactions
);

export default router;