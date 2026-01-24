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

### Installation

```bash
# Install dependencies
yarn

# Start development server
yarn dev
```

The app will be available at `http://localhost:5173`

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
│   └── split-layout/     # Main app layout
├── relay/                # Relay environment config
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

## Development

### Code Formatting

Run Prettier to format all files:

```bash
yarn format
```

### Linting

````bash
yarn lint
g```
````
