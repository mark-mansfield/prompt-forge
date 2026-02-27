# PromptForge

A/B testing tool for comparing LLM prompt responses side-by-side.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Relay (GraphQL)
- ai-sdk

### Prerequisites

- Netlify - frontend, and edge functions
- Supabase - the graphQL backend
- Netlify CLI (`npm install -g netlify-cli`)

### Installation

```bash
# Install dependencies
yarn

# Start development server (Netlify dev + Edge Functions + Vite HMR)
yarn dev
```

The app will be available at `http://localhost:5173`

> Note: `yarn dev` uses `netlify dev` so the Edge Function auth route (`/auth/employer`) works locally.
> If you only want Vite (no Netlify functions), run `yarn dev:vite` instead.

## Employer password auth (Netlify Edge Function)

This project includes a simple password gate backed by a Netlify Edge Function.

- **Edge Function**: `netlify/edge-functions/employer-auth.ts`
- **Route**: `GET/POST /auth/employer`
- **Cookie**: `pf_employer_session` (HMAC-signed + expiring; server-verified)

### Local dev

Run the app through Netlify so the Edge Function is available:

```bash
netlify dev
```

Open the app at `http://localhost:5173`.

### Required environment variables

Set these in your `.env` for local dev, and in Netlify site environment variables for deploys:

Supabase

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_ANON_KEY`

Netlify

- `GATE_PASSWORD`: the passcode users must enter
- `GATE_SESSION_SECRET`: HMAC secret used to sign the session cookie (use a long random value)
- `GATE_ALLOWED_ORIGINS`: comma-separated allowlist for browser `Origin` (e.g. `http://localhost:5173`)
