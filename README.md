# BolãoCopa 2026

A full-stack FIFA World Cup 2026 betting pool app. Players submit score predictions for all 48 group-stage matches, earn points based on accuracy, and compete on a live-updating leaderboard.

![Built with React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Score predictions** — pick exact scores for all 48 group-stage matches
- **Live ranking** — real-time leaderboard with Supabase Realtime subscriptions
- **Ranking evolution chart** — track position changes over time
- **Special picks** — predict champion, top scorer, and best goalkeeper
- **Real-time chat** — per-game comment section with live updates
- **Share card** — generate a 1080×1080 PNG of your predictions
- **Admin panel** — enter results, manage users, send push notifications
- **Push notifications** — Web Push reminders before each match
- **PWA** — installable on iOS and Android, offline-capable
- **Dark / light theme** — system default with manual override
- **i18n** — Portuguese (pt-BR), English, and Spanish

## Quick start

### Prerequisites

- Node 18+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/bolao-copa.git
cd bolao-copa
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Run the automated setup (generates VAPID keys, runs migrations, configures GitHub Secrets):

```bash
npm run setup
```

Or run migrations manually:

```bash
npm run migrate          # schema only
npm run migrate -- --seed  # schema + 72 Copa 2026 matches
```

### 3. Deploy the Edge Function

```bash
supabase functions deploy enviar-push
supabase secrets set VAPID_PRIVATE_KEY=your_vapid_private_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Start development

```bash
npm run dev
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key |
| `VITE_APP_NAME` | No | App display name (default: `BolãoCopa`) |
| `VITE_APP_YEAR` | No | Tournament year (default: `2026`) |
| `VITE_BASE_URL` | No | Deployment base path (default: `/`) |
| `VITE_VAPID_PUBLIC_KEY` | Push | VAPID public key for Web Push |

> **Never commit** `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, or `SUPABASE_DB_PASSWORD`.
> `.env.local` is in `.gitignore` — use it for all secrets.

## Architecture

```
src/
├── components/       Shared UI (Navbar, Logo, ChatJogo, CompartilharCard …)
├── config/           app.ts (env), torneio.ts (teams/groups/scoring)
├── contexts/         AuthContext, ThemeContext
├── hooks/            useNotificacoes, useRankingHistorico …
├── i18n/             i18next init + locales (pt-BR / en / es)
├── pages/            Route-level components
│   └── admin/        Admin-only pages behind isAdmin guard
└── supabase/         Client singleton

supabase/
├── functions/        Edge Functions (enviar-push)
└── migrations/       000_seed … 009_push_notifications

scripts/
├── setup.ts          One-command project setup
└── migrate.ts        Idempotent migration runner
```

### Database tables

| Table | Description |
|---|---|
| `profiles` | User display names and admin flag |
| `jogos` | Match schedule with results |
| `palpites` | User score predictions |
| `escolhas_especiais` | Champion / top scorer / keeper picks |
| `convites` | Invite codes |
| `comentarios` | Per-game chat messages |
| `ranking_historico` | Daily ranking snapshots |
| `push_subscriptions` | Web Push endpoint subscriptions |

### Points system

| Result | Group stage | Knockout |
|---|---|---|
| Exact score | 10 pts | 15 pts |
| Correct winner + GD | 7 pts | 10 pts |
| Correct winner only | 5 pts | 5 pts |

## Customization

To run your own edition of BolãoCopa for a different tournament:

1. Edit `src/config/torneio.ts` — replace teams, groups, and key dates
2. Edit `supabase/migrations/000_seed.sql` — replace match schedule
3. Update `VITE_APP_NAME` and `VITE_APP_YEAR` in `.env.local`
4. Rebuild and redeploy

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) — Gabriel Lima, 2026
