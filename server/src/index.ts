import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';

import authRouter from './routes/auth';
import cardsRouter from './routes/cards';
import notesRouter from './routes/notes';
import setsRouter from './routes/sets';
import { authMiddleware } from './middleware/auth';

const PORT = process.env.PORT ?? 3001;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/vocab';

const corsOrigins =
  process.env.CORS_ORIGIN?.split(',')
    .map((s) => s.trim())
    .filter(Boolean) ?? [];

async function main() {
  await mongoose.connect(MONGODB_URI);
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors(
      corsOrigins.length > 0 ? { origin: corsOrigins } : { origin: true }
    )
  );
  app.use(express.json({ limit: '1mb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX ?? 500),
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(apiLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/sets', authMiddleware, setsRouter);
  app.use('/api/cards', authMiddleware, cardsRouter);
  app.use('/api/notes', authMiddleware, notesRouter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
