// authController.ts
import { Request, Response } from 'express';
import { google } from 'googleapis';

// In-memory token store for demo; replace with DB/session in production
const tokenStore: { tokens?: any; user?: { email?: string; name?: string } } = {};

function getOAuthClient() {
  // Read environment variables at runtime
  const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;
  
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error('Missing Gmail OAuth configuration. Check your .env file.');
  }
  
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

export function getAuthUrl(_req: Request, res: Response) {
  try {
    const oauth2Client = getOAuthClient();
    console.log('OAuth config loaded successfully');
    const scopes = [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
    });

    console.log('Generated OAuth URL:', url);
    res.json({ url });
  } catch (error: any) {
    console.error('Error generating OAuth URL:', error.message);
    res.status(500).json({ error: error.message });
  }
}

export async function oauthCallback(req: Request, res: Response) {
  try {
    const code = req.query.code as string;
    console.log('OAuth callback received with code:', code ? 'present' : 'missing');
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    tokenStore.tokens = tokens;
    // Fetch user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    tokenStore.user = { email: me.data.email || undefined, name: me.data.name || undefined };
    const payload = JSON.stringify({ type: 'gmail_connected', email: tokenStore.user.email, name: tokenStore.user.name });
    res.send(`<script>if (window.opener) { try { window.opener.postMessage(${payload}, '*'); } catch (e) {} } window.close();</script>`);
  } catch (err: any) {
    console.error('OAuth callback error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

export function connectionStatus(_req: Request, res: Response) {
  res.json({ connected: Boolean(tokenStore.tokens), email: tokenStore.user?.email, name: tokenStore.user?.name });
}

export function testConnection(_req: Request, res: Response) {
  res.json({ 
    message: 'Backend is running',
    env: {
      hasClientId: !!process.env.GMAIL_CLIENT_ID,
      hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GMAIL_REDIRECT_URI,
      redirectUri: process.env.GMAIL_REDIRECT_URI
    }
  });
}

export function getAuthorizedClient() {
  if (!tokenStore.tokens) return null;
  const client = getOAuthClient();
  client.setCredentials(tokenStore.tokens);
  return client;
}

export function clearConnection(_req: Request, res: Response) {
  tokenStore.tokens = undefined;
  tokenStore.user = undefined;
  res.json({ cleared: true });
}


