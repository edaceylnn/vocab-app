import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { getJwtSecret } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 10;

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      res.status(400).json({ error: 'Invalid email' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({ email: trimmed, passwordHash });
    const id = String(user._id);
    const token = jwt.sign({ sub: id, email: trimmed }, getJwtSecret(), { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, email: trimmed } });
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: number }).code === 11000) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    res.status(500).json({ error: String(e) });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }
    const trimmed = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: trimmed }).lean();
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    const id = String(user._id);
    const token = jwt.sign({ sub: id, email: trimmed }, getJwtSecret(), { expiresIn: '7d' });
    res.json({ token, user: { id, email: trimmed } });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
