import { Router, Request, Response } from 'express';
import { getFirebaseAdmin } from '../utils/firebase';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  idToken: z.string().min(1),
  workspacePassword: z.string().min(1),
});

// Verify Firebase token and workspace password
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { idToken, workspacePassword } = loginSchema.parse(req.body);

    // Verify workspace password
    if (workspacePassword !== process.env.WORKSPACE_PASSWORD) {
      res.status(401).json({ error: 'Invalid workspace password' });
      return;
    }

    // Verify Firebase ID token
    const admin = getFirebaseAdmin();
    if (!admin) {
      res.status(500).json({ error: 'Firebase Admin not initialized' });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Optionally set a custom claim for workspace access
    await admin.auth().setCustomUserClaims(decodedToken.uid, {
      workspaceAccess: true,
      grantedAt: Date.now(),
    });

    res.json({ 
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    console.error('Login error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

// Verify token endpoint
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.json({ authenticated: false });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const admin = getFirebaseAdmin();

    if (!admin) {
      res.json({ authenticated: false });
      return;
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user has workspace access via custom claims
    const hasWorkspaceAccess = decodedToken.workspaceAccess === true;
    
    res.json({ 
      authenticated: hasWorkspaceAccess,
      user: hasWorkspaceAccess ? {
        uid: decodedToken.uid,
        email: decodedToken.email,
      } : undefined
    });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

// Logout (client-side Firebase signOut is primary, this is for cleanup)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const admin = getFirebaseAdmin();
      
      if (admin) {
        const decodedToken = await admin.auth().verifyIdToken(token);
        // Remove custom claims
        await admin.auth().setCustomUserClaims(decodedToken.uid, {
          workspaceAccess: null,
        });
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    // Even if token verification fails, return success for logout
    res.json({ success: true });
  }
});

export default router;
