# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 2026-06-12

### Added
- Internationalization (i18n) with pt-BR, English, and Spanish support
- Language toggle in Navbar cycling through all supported locales
- `src/config/torneio.ts` with all 48 Copa do Mundo 2026 teams, 12 groups, key dates, and scoring config
- `src/config/app.ts` centralized configuration replacing all hardcoded strings
- `scripts/setup.ts` — interactive one-command project setup with VAPID key generation
- `scripts/migrate.ts` — idempotent migration runner with `_migrations` tracking table
- GitHub Actions: `pr-check.yml` (lint + build on PRs), `dependabot.yml` (weekly npm, monthly Actions)
- Added lint step to `deploy.yml` before build
- `supabase/migrations/` directory with 9 numbered migration files + seed data
- `.env.example` with all required variables and documentation

### Changed
- All hardcoded `BolãoCopa 2026` strings replaced with `APP_FULL_NAME` / `APP_CONFIG`
- `deploy.yml` now passes `VITE_APP_NAME`, `VITE_APP_YEAR`, `VITE_BASE_URL`, `VITE_VAPID_PUBLIC_KEY`
- `Navbar` supports both dark and light mode with `dark:` Tailwind variants

### Security
- `SUPABASE_SERVICE_ROLE_KEY` confirmed as server-only (Edge Function only)
- `.env.local` added to `.gitignore`; no real credentials in `.env.example`

## [1.4.0] - 2026-06-05

### Added
- PWA support via `vite-plugin-pwa` with full offline capability
- Web Push notifications with VAPID key pair and Edge Function `enviar-push`
- `useNotificacoes` hook — requests push permission, registers service worker, schedules local reminders
- `ConfigNotificacoes` component on `/perfil` page
- `push_subscriptions` table with RLS in Supabase
- Dark / light / system theme support via `ThemeContext`
- `ThemeToggle` component in Navbar with animated Sun/Moon icon
- `NotFound.tsx` — 404 page with navigation back to home
- `LoadingGlobal.tsx` — fullscreen loading spinner
- SEO meta tags in `index.html` (og:*, twitter:card, theme-color)
- `ScrollToTop` component resetting scroll position on route change
- `InstalarPWA` banner for iOS/Android install prompt

### Changed
- `body`, `.glass`, `.input-glow` updated for light mode compatibility in `index.css`
- `tailwind.config.js` — added `darkMode: 'class'`
- `index.html` — `<html class="dark">` as default

## [1.3.0] - 2026-05-29

### Added
- Chat per game card in `Palpites.tsx` — collapsible with comment count badge
- Share card (Canvas API 1080×1080) component `CompartilharCard` in `Palpites.tsx`
- Ranking evolution chart (`GraficoRanking` with recharts `LineChart`) in `Ranking.tsx`
- Chat management page at `/admin/chat` with link in `AdminLayout`

### Fixed
- Ranking header showed duplicate "Palpites" column; corrected to "Pts"

## [1.2.0] - 2026-05-22

### Added
- Real-time chat per game (`ChatJogo.tsx`) powered by Supabase Realtime
- `ranking_historico` table + `useRankingHistorico` hook for historical snapshots
- Special picks (`escolhas_especiais`) — champion, top scorer, best keeper predictions
- Invite system (`convites`) with unique codes and usage tracking

### Changed
- Points recalculation triggered automatically via Postgres function on score update

## [1.1.0] - 2026-05-15

### Added
- Statistics page with team win/draw/loss breakdown and top scorers
- Simulator page for running hypothetical group stage outcomes
- Groups page showing all 12 Copa 2026 groups with flags
- Admin panel: game management, user management, results entry

### Changed
- Profile page now shows full prediction history and points breakdown

## [1.0.0] - 2026-05-08

### Added
- Initial release
- Authentication (sign up / sign in) via Supabase Auth
- Predictions (`palpites`) for all 48 group stage matches
- Points system: 10 pts exact score, 7 pts correct result, 5 pts correct winner
- Ranking with real-time updates
- Dashboard with upcoming games and user stats
- Admin-only game result entry with automatic points recalculation
- RLS policies on all tables using `is_user_admin()` SECURITY DEFINER function
