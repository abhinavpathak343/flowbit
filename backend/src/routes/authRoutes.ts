// authRoutes.ts
import { Router } from 'express';
import { getAuthUrl, oauthCallback, connectionStatus, clearConnection, testConnection } from '../controller/authController';

const router = Router();

router.get('/auth/test', testConnection);
router.get('/auth/google/url', getAuthUrl);
router.get('/auth/google/callback', oauthCallback);
router.get('/auth/status', connectionStatus);
router.post('/auth/clear', clearConnection);

export default router;


