import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import * as exportController from '../controllers/export.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  monthlyReportQuerySchema,
  exportCsvQuerySchema,
} from '../validators/report.schema';

const router = Router();

router.use(authMiddleware);

router.get(
  '/monthly',
  validate(monthlyReportQuerySchema, 'query'),
  reportController.getMonthlyReport
);
router.get(
  '/export/csv',
  validate(exportCsvQuerySchema, 'query'),
  exportController.exportCsv
);

export default router;