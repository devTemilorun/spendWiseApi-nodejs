import { Router } from 'express';
import * as catController from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createCategorySchema } from '../validators/transaction.schema';

const router = Router();

router.use(authMiddleware);

router.get('/', catController.listCategories);
router.post('/', validate(createCategorySchema), catController.createCategory);
router.delete('/:id', catController.deleteCategory);

export default router;