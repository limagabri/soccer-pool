# Contributing to BolãoCopa

Thank you for your interest in contributing! Here's how to get started.

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/bolao-copa.git
cd bolao-copa
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run setup                 # runs migrations automatically
npm run dev
```

## Commit style (Conventional Commits)

```
feat:     new feature
fix:      bug fix
docs:     documentation only
style:    formatting, no logic change
refactor: code change without feature/fix
test:     tests
chore:    build, deps, tooling
```

Example: `feat: add group stage bracket view`

## Opening a Pull Request

1. Fork the repo and create a branch from `main`
2. Make your changes and ensure `npm run lint && npm run build` pass
3. Fill in the PR template
4. Open the PR against `main`

## Code style

- TypeScript everywhere — no `any` unless justified
- Tailwind classes only — no inline styles
- Domain terms in Portuguese are intentional (`palpites`, `jogos`, `pontos`)
- New variables, comments and documentation in English
- No `console.log` in committed code
- One component per file

## Reporting bugs

Use the GitHub Issues bug report template.
