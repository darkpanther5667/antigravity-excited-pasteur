import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Route imports
import healthRouter from './src/routes/health.js';
import authRouter from './src/routes/auth.js';
import questionsRouter from './src/routes/questions.js';
import testsRouter from './src/routes/tests.js';
import analyticsRouter from './src/routes/analytics.js';
import leaderboardRouter from './src/routes/leaderboard.js';
import paymentsRouter from './src/routes/payments.js';

// Middleware imports
import { errorHandler } from './src/middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS — always allow the requesting origin
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

// Log API requests in development format
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check at both root/health and API path
app.use('/health', healthRouter);
app.use('/api/v1/health', healthRouter);

// API v1 prefix mounting
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/tests', testsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/payments', paymentsRouter);

// Global Error Handler Middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`JEE Test Platform Server listening on http://localhost:${PORT}`);
});
