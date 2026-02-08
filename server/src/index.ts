import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';

import cardsRouter from './routes/cards';
import setsRouter from './routes/sets';

const PORT = process.env.PORT ?? 3001;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/vocab';

async function main() {
  await mongoose.connect(MONGODB_URI);
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/sets', setsRouter);
  app.use('/api/cards', cardsRouter);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
