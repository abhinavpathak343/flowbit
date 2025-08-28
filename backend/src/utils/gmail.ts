// gmail.ts
import { google } from 'googleapis';
import { getAuthorizedClient } from '../controller/authController';

function getFallbackClient() {
  const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
  const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
  const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI;
  const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
  
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    throw new Error('Missing Gmail OAuth configuration. Check your .env file.');
  }
  
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  if (REFRESH_TOKEN) {
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  }
  return oAuth2Client;
}

export async function readEmails(params?: { from?: string; query?: string; maxResults?: number }) {
  try {
    // Try to use authorized client first, fallback to refresh token
    let client;
    try {
      const authorizedClient = getAuthorizedClient();
      if (authorizedClient) {
        client = authorizedClient;
      } else {
        client = getFallbackClient();
      }
    } catch {
      client = getFallbackClient();
    }
    
    const gmail = google.gmail({ version: 'v1', auth: client });
    let q = params?.query || '';
    if (params?.from) {
      q = q ? `${q} from:${params.from}` : `from:${params.from}`;
    }
    const res = await gmail.users.messages.list({ userId: 'me', maxResults: params?.maxResults || 5, q: q || undefined });
    const messages = res.data.messages || [];
    const results = [];
    for (const msg of messages) {
      const msgRes = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
      const headers = msgRes.data.payload?.headers || [];
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const to = headers.find(h => h.name === 'To')?.value || '';
      const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
      const date = dateHeader ? new Date(dateHeader).toISOString() : undefined;
      const snippet = msgRes.data.snippet || '';
      results.push({ subject, from, to, date, snippet });
    }
    return results;
  } catch (error) {
    console.error('Error reading emails:', error);
    throw error;
  }
}

export async function sendEmail({ to, subject, message, inReplyTo }: { to: string; subject?: string; message?: string; inReplyTo?: string }) {
  try {
    // Try to use authorized client first, fallback to refresh token
    let client;
    try {
      const authorizedClient = getAuthorizedClient();
      if (authorizedClient) {
        client = authorizedClient;
      } else {
        client = getFallbackClient();
      }
    } catch {
      client = getFallbackClient();
    }
    const gmail = google.gmail({ version: 'v1', auth: client });
    const safeSubject = (subject && subject.trim()) ? subject.trim() : 'Message from FlowBitAi';
    const safeMessage = (message && String(message).trim()) ? String(message).trim() : '(no content)';
    let raw =
      `To: ${to}\r\n` +
      `Subject: ${safeSubject}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n`;
    if (inReplyTo) {
      raw += `In-Reply-To: ${inReplyTo}\r\nReferences: ${inReplyTo}\r\n`;
    }
    raw += `\r\n${safeMessage}`;
    const encoded = Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encoded },
    });
    return { success: true, id: response.data.id };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
