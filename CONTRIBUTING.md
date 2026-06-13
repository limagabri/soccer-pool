# Contributing to Soccer Pool

Thank you for your interest in contributing!

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/soccer-pool.git
cd soccer-pool
npm install
npm run setup    # configures env, runs migrations
npm run dev
```

See [MANUAL_SETUP.md](MANUAL_SETUP.md) if you prefer step-by-step instructions.

## Commit style (Conventional Commits)

```
feat:      new feature
fix:       bug fix
docs:      documentation only
style:     formatting, no logic change
refactor:  code change without feature/fix
test:      tests
chore:     build, deps, tooling
```

Example: `feat: add group stage bracket view`

## Opening a Pull Request

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run lint && npm run build` pass with zero errors
4. Fill in the PR description with what changed and why
5. Open the PR against `main`

## Code style

- TypeScript everywhere — no `any` unless justified
- Tailwind classes only — no inline styles
- Domain terms in Portuguese are intentional (`palpites`, `jogos`, `pontos`)
- New variables, comments, and documentation in English
- No `console.log` in committed code
- One component per file

## Reporting bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs. actual behavior
- Browser and OS version
