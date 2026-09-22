import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.middleware';
import { getDBStatus } from './config/db';
import { apiResponse } from './utils/apiResponse';
import authRoutes from './routes/auth.routes';


const app: Application = express();

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  apiResponse(
    res,
    {
      uptime: process.uptime(),
      db: getDBStatus(),
      timestamp: new Date().toISOString(),
    },
    'SpendWise API is running'
  );
});

// Routes
app.use('/api/auth', authRoutes);


// 404 + error handlers 
app.use(notFoundHandler);
app.use(errorHandler);

export default app;