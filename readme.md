

# FlowBitAI

A full-stack workflow automation platform with Gmail and LLM integration.

---

## Backend (Node.js + TypeScript)

**Setup:**
.env
   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REDIRECT_URI`
   - `OPENAI_API_KEY`
   - `GMAIL_REFRESH_TOKEN`
   -`PORT`


2. Install dependencies:
   ```sh
   cd backend
   npm install
   ```

3. Build and start:
   ```sh
   npm run build
   npm start
   ```

---

## Frontend (React + Vite + Tailwind)

**Setup:**
1. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```

2. Start development server:
   ```sh
   npm run dev
   ```

---



## OAuth Setup

- In Google Cloud Console, set the **Authorized redirect URI** to match your deployed backend:
  ```
  https://<your-backend-domain>/api/auth/google/callback
  ```

---
