import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  password: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { password } = loginSchema.parse(req.body);

    if (password !== process.env.WORKSPACE_PASSWORD) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    const token = jwt.sign(
      { userId: 'workspace' },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    throw error;
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ success: true });
});

router.get('/check', (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      res.json({ authenticated: false });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET!);
    res.json({ authenticated: true });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

export default router;
