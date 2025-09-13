// app.ts
import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflowRoutes';
import authRoutes from './routes/authRoutes';
import llmRoutes from './routes/llmRoutes';
import webhookRoutes from './routes/webhookRoutes';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with explicit path
const envPath = path.resolve(__dirname, '../.env');
console.log('Looking for .env at:', envPath);
const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result);
console.log('Current working directory:', process.cwd());
console.log('Environment variables loaded:', {

  PORT: process.env.PORT || '3000'
});

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', workflowRoutes);
app.use('/api', authRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api', webhookRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("Hello");
});

// Basic error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

export default app;
