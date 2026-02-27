# PromptForge

A/B testing tool for comparing LLM prompt responses side-by-side.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Relay (GraphQL)
### Prerequisites
This repo assumes you are using netlify.
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

- `EMPLOYER_PASSWORD`: the passcode users must enter
- `EMPLOYER_SESSION_SECRET`: HMAC secret used to sign the session cookie (use a long random value)
- `EMPLOYER_ALLOWED_ORIGINS`: comma-separated allowlist for browser `Origin` (e.g. `http://localhost:5173`)

