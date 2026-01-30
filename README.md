# PromptForge

A/B testing tool for comparing LLM prompt responses side-by-side.

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Relay (GraphQL)

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn (`npm install -g yarn`)
- Netlify CLI (`npm install -g netlify-cli`)

### Installation

```bash
# Install dependencies
yarn

# Start development server
yarn dev
```

The app will be available at `http://localhost:5173`

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

Open the app at `http://localhost:8888`.

### Required environment variables

Set these in your `.env` for local dev, and in Netlify site environment variables for deploys:

- `EMPLOYER_PASSWORD`: the passcode users must enter
- `EMPLOYER_SESSION_SECRET`: HMAC secret used to sign the session cookie (use a long random value)
- `EMPLOYER_ALLOWED_ORIGINS`: comma-separated allowlist for browser `Origin` (e.g. `http://localhost:8888`)

### Available Scripts

| Command        | Description                   |
| -------------- | ----------------------------- |
| `yarn dev`     | Start development server      |
| `yarn build`   | Build for production          |
| `yarn preview` | Preview production build      |
| `yarn lint`    | Run ESLint                    |
| `yarn format`  | Format code with Prettier     |
| `yarn relay`   | Compile Relay GraphQL queries |

## Project Structure

```
src/
├── components/
│   ├── password-gate/    # Auth gate component
│   └── layout/           # Main app layout
├── relay/                # Relay environment config
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

## Development

### Relay → Domain adapters

Relay-generated types are intentionally _forward compatible_ (notably enums include `"%future added value"`),
so they won’t perfectly match strict UI/domain models. This project uses an explicit adapter boundary:

- `src/domain/promptAdapter.ts`

Components convert Relay fragment data into domain types via this adapter. The policy is **fail fast** on
schema drift: if the backend adds a new enum value, the adapter throws with a message telling you where
to update.

### Relay UI state (Active Tab)

This app keeps the sidebar active tab in the **Relay store** (client-side) using a **Relay Resolver**.
This lets multiple sidebar children react to tab changes without prop-drilling local React state everywhere.

#### Files

- **Client schema extension**: `src/schema.client.graphql`
  - `activeTabIdBacking: String` (stored in Relay store via `commitLocalUpdate`)
  - `activeTabId: String!` (computed by a Relay Resolver)
- **Relay compiler config**: `relay.config.json`
  - Includes the extension file:
    - `"schemaExtensions": ["./src/schema.client.graphql"]`
- **Resolver implementation**: `src/relay/resolvers/ActiveTabIdResolver.ts`
  - Reads `activeTabIdBacking` from a fragment on `Query`
  - Returns `'all'` when backing is `null`
- **Write helper**: `src/relay/ui-state.ts`
  - Uses `commitLocalUpdate` to set the root backing field:
    - `store.getRoot().setValue(tabId, 'activeTabIdBacking')`

#### How to use in UI

- **Read**: select `activeTabId` in your Relay queries
- **Write**: on tab click, call the helper that updates `activeTabIdBacking`

#### Gotchas

- If Relay says `Query has no field activeTabIdBacking`, make sure `src/schema.client.graphql` is **saved to disk**
  and rerun `yarn relay`.

### Code Formatting

Run Prettier to format all files:

```bash
yarn format
```

### Linting

```bash
yarn lint
```
