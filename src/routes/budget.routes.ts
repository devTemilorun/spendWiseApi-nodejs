import { Router } from 'express';
import * as budgetController from '../controllers/budget.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  setBudgetSchema,
  getBudgetQuerySchema,
  listBudgetsQuerySchema,
} from '../validators/budget.schema';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(setBudgetSchema), budgetController.setBudget);
router.get(
  '/',
  validate(listBudgetsQuerySchema, 'query'),
  budgetController.listBudgets
);
router.get(
  '/category',
  validate(getBudgetQuerySchema, 'query'),
  budgetController.getBudget
);
router.delete('/:id', budgetController.deleteBudget);

export default router;