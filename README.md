# ⚽ Soccer Pool

[![Deploy](https://github.com/limagabri/soccer-pool/actions/workflows/deploy.yml/badge.svg)](https://github.com/limagabri/soccer-pool/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com)

> A full-featured World Cup 2026 prediction game (a "bolão").
> Free to host on GitHub Pages. Powered by React + Supabase + AI commentary.

**🔴 Live demo:** [limagabri.github.io/soccer-pool](https://limagabri.github.io/soccer-pool/) (running as *BolãoCopa 2026*)

## ✨ Features

- ⚽ **Score predictions** — pick exact scores for all 72 group-stage matches, in a chronological "now" view (recent + upcoming)
- 👀 **See everyone's picks** — once a match kicks off, reveal every player's prediction for it (no peeking before)
- 🏆 **Live ranking** — real-time leaderboard with instant updates
- 📈 **Ranking evolution chart** — track position changes over time
- 🥅 **Auto top-scorer chart** — goalscorers pulled automatically from the live results feed
- 🌟 **Special picks** — predict champion, runner-up, third, top scorer, and best player
- 💬 **Real-time chat** — per-game comments with quick reactions and `@mentions`
- 🔔 **Push notifications** — Web Push (aes128gcm via `web-push`); get pinged when someone `@mentions` you
- 🤖 **AI comic commentary** — GPT-powered "Seu Zé" reacts to every goal
- 📸 **Stories** — AI-generated tournament recap stories, Instagram-style (hold to pause)
- 🎉 **Goal animation** — confetti + sound when a goal drops in real time
- 📤 **Share card** — generate a PNG of your predictions for WhatsApp
- 🛡️ **Admin panel** — manage matches, users, invites, special results and push
- 📱 **PWA** — installable on iOS and Android, offline-capable, auto-updates on new deploys
- 🌙 **Dark / light theme** — system default with manual override
- 🌐 **i18n** — full Portuguese, English & Spanish (i18next), across **both** the participant app and the admin console
- 🔐 **Invite system** — control who can join your pool

## 🚀 Quick Start (5 minutes)

```bash
git clone https://github.com/limagabri/soccer-pool.git
cd soccer-pool
npm install
npm run setup    # interactive wizard: configures env, runs migrations, sets GitHub Secrets
npm run dev
```

Open http://localhost:5173 — done.

For manual setup without the wizard, see [MANUAL_SETUP.md](MANUAL_SETUP.md).

## 🏗️ Architecture

```
Browser (React 19 + Vite + Tailwind CSS)
    │
    │ HTTPS (static files)
    ▼
GitHub Pages (free hosting)
    │
    │ REST + Realtime WebSocket
    ▼
Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
    │
    ├── OpenAI GPT (AI comic commentary & stories — "Seu Zé")
    └── ESPN public API (automatic result, scorer & kickoff-time sync — no API key)
```

```
src/
├── components/     Shared UI (Navbar, ChatJogo, PalpitesJogo, StoriesViewer, Footer …)
├── config/         app.ts (env), torneio.ts (teams/groups/scoring)
├── contexts/       AuthContext, ThemeContext, JogosContext
├── hooks/          useJogos, useNotificacoes, useGolRealtime, useRankingHistorico …
├── i18n/           i18next init + locales (pt-BR / en / es)
├── pages/          Route-level components
│   └── admin/      Admin-only pages behind isAdmin guard
└── lib/            Supabase client, scoring (pontuacao) and helpers

supabase/
├── functions/      Edge Functions (see table below)
└── migrations/     000_seed … 015_fix_missing_tables

scripts/
├── setup.ts        Interactive project setup wizard
├── migrate.ts      Idempotent migration runner (tracks via _migrations table)
└── delete-test-users.ts  Removes test data before production
```

### Edge Functions

| Function | Purpose |
|---|---|
| `sync-resultados` | Pulls scores, goalscorers and kickoff times from ESPN (cron every 2 min); feeds results, top-scorer chart and keeps the schedule in sync |
| `gerar-comentarista` | Generates "Seu Zé" AI commentary for a round |
| `gerar-story` | Generates AI recap stories |
| `criar-usuario` | Admin-only: creates a participant account |
| `enviar-push` | Sends Web Push notifications |
| `admin-upsert-palpites` | Admin-only: bulk-edit predictions |

## ⚙️ Environment Variables

| Variable | Required | Description | Where to get |
|---|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL | Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon key | Dashboard → Settings → API |
| `VITE_APP_NAME` | — | App display name (e.g. `BolãoCopa`) | — |
| `VITE_APP_YEAR` | — | Tournament year (default: `2026`) | — |
| `VITE_BASE_URL` | — | Deployment URL (e.g. `https://user.github.io/soccer-pool`) | — |
| `VITE_VAPID_PUBLIC_KEY` | Push | VAPID public key | Auto-generated by `npm run setup` |
| `OPENAI_API_KEY` | AI | OpenAI key for commentary/stories (Supabase Edge Function secret) | platform.openai.com |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts | Admin operations (never in frontend) | Dashboard → Settings → API |
| `SUPABASE_DB_URL` | CI/CD | Connection string for auto-migrations (use the **IPv4 pooler**, not the direct host) | Dashboard → Database → Connection pooling |
| `SUPABASE_ACCESS_TOKEN` | CI/CD | Personal access token to auto-deploy Edge Functions | supabase.com → Account → Access Tokens |

> Result sync uses ESPN's **public** API — **no key required**.
>
> **Security:** Never commit `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `SUPABASE_DB_URL` or `OPENAI_API_KEY`. `.env.local` / `.env.production` are in `.gitignore`. See `.env.example` for the full template.

## 🗄️ Database

### Automated (recommended)

```bash
npm run setup           # runs migrations + seed automatically
```

### Manual

```bash
npm run migrate            # schema only (001–015)
npm run migrate -- --seed  # schema + 72 World Cup 2026 matches
```

The runner is idempotent and tracks applied files in a `_migrations` table, so it
only runs what's new. See [MANUAL_SETUP.md](MANUAL_SETUP.md) for SQL Editor steps.

### Tables

| Table | Description |
|---|---|
| `profiles` | Display names, admin flag, special-pick bonus points |
| `jogos` | Match schedule (`timestamptz` kickoff), results and status |
| `palpites` | User score predictions |
| `escolhas_especiais` | Champion / top scorer / keeper picks per user |
| `resultados_especiais` | Official special results (set by admin) |
| `convites` | Invite codes with usage tracking |
| `comentarios` | Per-game real-time chat messages |
| `comentarios_ia` | AI "Seu Zé" commentary per round |
| `stories` | AI-generated tournament recap stories |
| `ranking_historico` | Daily ranking snapshots for the evolution chart |
| `push_subscriptions` | Web Push endpoint registrations |
| `eventos_jogo` | Goals & assists per match (feeds the top-scorer chart and goal animation) |

### Points system

**Per match**

| Result | Points |
|---|---|
| Exact score | **10** |
| Correct winner / draw | **5** |
| Wrong | 0 |

**Special picks** (one-off, tournament-long)

| Pick | Points |
|---|---|
| 🏆 Champion | 30 |
| ⚽ Top scorer | 20 |
| 🌟 Best player | 15 |
| 🥈 Runner-up | 15 |
| 🥉 Third place | 10 |
| 🛡️ Best defense (fewest goals conceded, auto) | 10 |

## 🎮 Customizing for Your Tournament

1. **Teams & groups** — Edit `src/config/torneio.ts`
2. **Match schedule** — Edit `supabase/migrations/000_seed.sql`
3. **App name & year** — Set `VITE_APP_NAME` / `VITE_APP_YEAR` (env or GitHub repo *Variables*)
4. **Points rules** — Edit `src/lib/utils.ts` (`calcularPontos`) and the special-pick values
5. **Languages** — Add locale files to `src/i18n/locales/`

## 🚢 Deploying

Push to `main` — GitHub Actions lints, runs migrations, deploys Edge Functions, builds and publishes to GitHub Pages automatically.

**GitHub Secrets** (Settings → Secrets and variables → Actions):
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅
- `VITE_VAPID_PUBLIC_KEY` (push)
- `SUPABASE_DB_URL` (optional — enables auto-migrations on deploy)
- `SUPABASE_ACCESS_TOKEN` (optional — enables auto-deploy of Edge Functions)

**GitHub Variables** (optional): `VITE_APP_NAME`, `VITE_APP_YEAR`, `VITE_BASE_URL`.

`npm run setup` configures the secrets automatically if you have the `gh` CLI installed.

**GitHub Pages setup** (first deploy only):
- Repository → Settings → Pages → Source: `gh-pages` branch

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 License

[MIT](LICENSE)

---

Made by [Gabriel Lima](https://github.com/limagabri) ⚽
