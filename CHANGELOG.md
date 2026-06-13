# Changelog

All notable changes to Soccer Pool are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-06-13 — Open Source Release

**Soccer Pool v1.0.0** — World Cup 2026 Edition.
Full-featured prediction game, free to host on GitHub Pages.

### Added — Sprint 12: Open Source Release
- Renamed project to `soccer-pool` for GitHub Pages hosting
- `npm run setup` interactive wizard: configures env, generates VAPID keys, runs migrations, sets GitHub Secrets, creates admin user
- `scripts/delete-test-users.ts` — removes seed test accounts via service_role
- `MANUAL_SETUP.md` — complete step-by-step fallback guide
- `CONTRIBUTING.md` — contributor guidelines in English
- `supabase/migrations/013_cleanup_test_data.sql` — removes test data before production
- GitHub Actions: automatic database migrations before each deploy (`SUPABASE_DB_URL` secret)
- `.env.example` now includes `SUPABASE_DB_URL` for CI/CD migrations
- `.gitignore` hardened with explicit `.env.local` and `.env*.local` entries

### Added — Sprint 11: Stories (v0.11.0)
- AI-generated tournament recap stories via `gerar-story` Edge Function
- `stories` table with scheduling and admin publish flow
- `/stories` route with animated story viewer
- Admin panel page `/admin/stories` for story management

### Added — Sprint 10: AI Commentary (v0.10.0)
- "Seu Zé" AI comic commentator powered by GPT
- `comentarios_ia` table storing per-event reactions
- `gerar-comentarista` Edge Function — reacts to goals, cards, and final whistles
- `/comentarios` page with animated commentary feed
- Admin panel page `/admin/comentarista` to trigger manual generation
- `eventos_jogo` table for tracking match events

### Added — Sprint 9: Push Notifications (v0.9.0)
- Web Push notifications (VAPID) via `enviar-push` Edge Function
- `push_subscriptions` table with RLS
- `useNotificacoes` hook — requests permission, registers service worker
- Push notification configuration on `/perfil` page
- Admin broadcast: send push to all subscribers from admin panel

### Added — Sprint 8: Chat & Ranking History (v0.8.0)
- Real-time per-game chat (`ChatJogo.tsx`) via Supabase Realtime
- `comentarios` table with RLS
- Admin chat moderation page at `/admin/chat`
- `ranking_historico` table for daily ranking snapshots
- `useRankingHistorico` hook with recharts `LineChart` evolution graph
- Share card (Canvas API, 1080×1080 PNG) on `/palpites`

### Added — Sprint 7: Statistics & Simulator (v0.7.0)
- Statistics page with team win/draw/loss breakdown and top scorers
- Simulator page for hypothetical group stage outcomes
- Groups page showing all 12 Copa 2026 groups with flags

### Added — Sprint 6: Admin Panel (v0.6.0)
- Admin panel at `/admin` (isAdmin guard via `is_user_admin()` SECURITY DEFINER)
- Game result entry with automatic points recalculation trigger
- User management: view, promote to admin, reset password
- Invite code management
- Special picks management (champion, top scorer, keeper)
- `admin-upsert-palpites` Edge Function for bulk prediction imports
- `criar-usuario` Edge Function for service-role user creation

### Added — Sprint 5: Special Picks & Invites (v0.5.0)
- Special picks (`escolhas_especiais`) — champion, top scorer, best keeper
- Invite system (`convites`) with unique codes and usage tracking
- Admin Convites page and Especiais page
- Invite-only registration flow

### Added — Sprint 4: Authentication & First Access (v0.4.0)
- Email + password auth via Supabase Auth
- First-access flow: username setup on first login
- Password reset (forgot password + reset link)
- Auth callback page for OAuth-style redirect handling
- `profiles` table with `primeiro_acesso` and `senha_trocada` flags

### Added — Sprint 3: PWA & Themes (v0.3.0)
- PWA support via `vite-plugin-pwa` with full offline capability
- Dark / light / system theme via `ThemeContext` and `ThemeToggle`
- Installable on iOS and Android (`InstalarPWA` banner)
- SEO meta tags (`og:*`, `twitter:card`, `theme-color`)
- `ScrollToTop` on route change

### Added — Sprint 2: i18n & Config (v0.2.0)
- Internationalization (i18n) with pt-BR, English, and Spanish
- Language toggle in Navbar cycling all locales
- `src/config/torneio.ts` — all 48 Copa 2026 teams, 12 groups, key dates, scoring
- `src/config/app.ts` — centralized env-driven configuration
- `scripts/migrate.ts` — idempotent migration runner with `_migrations` tracking table
- `supabase/migrations/` directory with numbered SQL files + seed data

### Added — Sprint 1: Core Game (v0.1.0)
- Score predictions for all 48 group stage matches
- Points system: 10 pts exact, 7 pts correct result, 5 pts correct winner
- Live ranking with Supabase Realtime subscriptions
- Dashboard with upcoming games and user stats
- `/palpites`, `/ranking`, `/dashboard`, `/simulador`, `/grupos`, `/estatisticas`
- Postgres trigger for automatic point recalculation on result entry
- RLS policies on all tables

---

*Previous pre-release versions (0.1.x – 0.11.x) are archived in git history.*
