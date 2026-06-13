# Manual Setup Guide

Step-by-step setup for Soccer Pool without the automated wizard.
Use this if `npm run setup` doesn't work in your environment.

---

## 1. Supabase Project

1. Create a free account at [supabase.com](https://supabase.com)
2. Click **New project**, choose a name and region, set a strong database password
3. Wait for provisioning (~2 minutes)
4. Go to **Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (never expose in frontend)
5. Go to **Settings → Database** and copy the database password

---

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
VITE_SUPABASE_URL=https://YOUR_REF.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_BASE_URL=https://YOUR_USERNAME.github.io/soccer-pool
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_PROJECT_REF=YOUR_REF
SUPABASE_DB_PASSWORD=your_password
GITHUB_REPO=YOUR_USERNAME/soccer-pool
```

Generate VAPID keys for push notifications:

```bash
npx web-push generate-vapid-keys
# Paste publicKey → VITE_VAPID_PUBLIC_KEY
# Paste privateKey → VAPID_PRIVATE_KEY
```

---

## 3. Database Migrations

Run each file in order in the **Supabase SQL Editor**
(Dashboard → SQL Editor → New query):

| Order | File | Description |
|---|---|---|
| 1 | `supabase/migrations/000_seed.sql` | 72 Copa 2026 match schedule |
| 2 | `supabase/migrations/001_profiles.sql` | User profiles + admin flag |
| 3 | `supabase/migrations/002_jogos.sql` | Match table with results |
| 4 | `supabase/migrations/003_palpites.sql` | Predictions + auto-scoring trigger |
| 5 | `supabase/migrations/004_escolhas_especiais.sql` | Special picks |
| 6 | `supabase/migrations/005_convites.sql` | Invite codes |
| 7 | `supabase/migrations/006_estatisticas.sql` | Statistics views |
| 8 | `supabase/migrations/007_chat.sql` | Real-time chat |
| 9 | `supabase/migrations/008_ranking_historico.sql` | Ranking history |
| 10 | `supabase/migrations/009_push_notifications.sql` | Web Push subscriptions |
| 11 | `supabase/migrations/010_comentarista.sql` | AI "Seu Zé" commentary |
| 12 | `supabase/migrations/011_ranking_policy.sql` | RLS ranking policies |
| 13 | `supabase/migrations/012_profiles_ranking_policy.sql` | Profile ranking RLS |
| 14 | `supabase/migrations/013_cleanup_test_data.sql` | Remove test data |

Or run all at once via CLI:

```bash
npm run migrate         # requires SUPABASE_DB_URL in .env.local
npm run migrate -- --seed  # also inserts 72 matches
```

---

## 4. Supabase Auth URLs

Go to **Authentication → URL Configuration** and add:

**Redirect URLs:**
```
https://YOUR_USERNAME.github.io/soccer-pool/auth/callback
https://YOUR_USERNAME.github.io/soccer-pool/nova-senha
http://localhost:5173/auth/callback
http://localhost:5173/nova-senha
```

---

## 5. Create Admin User

**Option A — Supabase Dashboard:**
1. Go to **Authentication → Users → Add user**
2. Fill email and password, enable "Auto Confirm User"
3. Copy the user's UUID
4. Run in SQL Editor:
   ```sql
   UPDATE profiles SET is_admin = true WHERE id = 'PASTE_USER_UUID_HERE';
   ```

**Option B — Script:**
```bash
npx tsx scripts/delete-test-users.ts  # clean test data first
```
Then create admin via Dashboard as above.

---

## 6. Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then:

```bash
supabase login
supabase functions deploy sync-resultados   --project-ref YOUR_REF
supabase functions deploy gerar-comentarista --project-ref YOUR_REF
supabase functions deploy gerar-story       --project-ref YOUR_REF
supabase functions deploy enviar-push       --project-ref YOUR_REF
supabase functions deploy admin-upsert-palpites --project-ref YOUR_REF
supabase functions deploy criar-usuario     --project-ref YOUR_REF
```

Set Edge Function secrets (Dashboard → Settings → Edge Functions → Secrets):
```
OPENAI_API_KEY          = sk-...
FOOTBALL_API_KEY        = your_key
VAPID_PRIVATE_KEY       = your_private_key
SUPABASE_SERVICE_ROLE_KEY = eyJ...
```

Enable cron jobs: run `supabase/functions/cron-config.sql` in the SQL Editor.

---

## 7. GitHub Secrets

Go to **Repository → Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Your anon key |
| `VITE_VAPID_PUBLIC_KEY` | Generated VAPID public key |
| `VITE_FOOTBALL_API_KEY` | football-data.org key |
| `SUPABASE_DB_URL` | Full DB connection string (for auto-migrations) |

**GitHub Variables** (not secrets — visible in logs):

| Variable | Value |
|---|---|
| `VITE_APP_NAME` | `Soccer Pool` |
| `VITE_APP_YEAR` | `2026` |
| `VITE_BASE_URL` | `https://YOUR_USERNAME.github.io/soccer-pool` |

---

## 8. GitHub Pages

1. Push to `main` — GitHub Actions will run the build automatically
2. Go to **Repository → Settings → Pages**
3. Set Source to **Deploy from a branch**
4. Select branch: `gh-pages`, folder: `/ (root)`
5. Save — your site will be live in ~1 minute

---

## 9. Verify Everything Works

- [ ] `npm run dev` starts without errors
- [ ] Sign-up creates a profile in Supabase
- [ ] Predictions page shows 48 matches
- [ ] Admin login works at `/admin`
- [ ] Push notification permission prompt appears on `/perfil`
- [ ] GitHub Actions build passes
- [ ] Site loads at `https://YOUR_USERNAME.github.io/soccer-pool`

---

## Troubleshooting

**"relation does not exist" errors**
→ Run the migration files in order via SQL Editor

**Auth redirect loop**
→ Check that redirect URLs in Supabase Auth match exactly (no trailing slash)

**PWA not installing**
→ Site must be served over HTTPS; GitHub Pages satisfies this

**Push notifications not working**
→ Verify `VAPID_PRIVATE_KEY` is set as an Edge Function secret
→ Check browser console for subscription errors

**AI commentary disabled**
→ Set `OPENAI_API_KEY` as an Edge Function secret in Supabase Dashboard
