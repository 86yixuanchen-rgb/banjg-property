# Banjg Property

AI-assisted repair coordination for Australian property managers. See [HANDOVER.md](HANDOVER.md) for setup, architecture and the to-do list, and [docs/PROJECT_PLAN.md](docs/PROJECT_PLAN.md) for the project plan.

## Development

Requires Node.js 20+ and npm.

```sh
npm install
cp .env.example .env.local   # fill in Clerk, DeepSeek and (optional) Google keys
npx wrangler d1 migrations apply DB --local
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
- Clerk
- Cloudflare D1 + Drizzle
