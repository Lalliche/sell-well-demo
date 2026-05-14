# SellWell — Frontend

Next.js frontend for the SellWell B2B sales partner platform.

## Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Styling:** Tailwind CSS v4 — config lives in `src/app/globals.css` via `@theme {}` block, no `tailwind.config.js`
- **i18n:** next-intl — locales: `en` (default), `fr`
- **State:** React Query (server state) + useState (local UI) + Context API when 3+ components share state
- **HTTP:** Axios — base instance in `src/lib/api.js` with session cookie + CSRF interceptor
- **Auth:** Session-based — Django `sessionid` (HttpOnly) + role cookie (readable by Edge middleware)

## Setup

### First time
```bash
npm install
# create .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev                 # http://localhost:3000
```

### Every time after that
```bash
npm run dev
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  app/[locale]/             ← locale-first routing — no app/layout.tsx at root
    (landing)/              ← public landing pages
    (auth)/                 ← login / signup
    (app)/                  ← authenticated dashboards (partner & company)
    (admin)/                ← SellWell-team-only pages
    layout.jsx              ← html / body / fonts / providers
  components/
    ui/                     ← AppButton, FormInputs (single source of truth)
    shared/                 ← anything used in 2+ places
    providers/              ← QueryProvider, AuthProvider
    landing/, auth/, marketplace/, dashboard/, leads/, partner-links/, admin/
  lib/
    api.js                  ← axios base instance
    Auth.js                 ← loginUser / logoutUser / fetchCurrentUser
    utils.ts                ← cn() helper (clsx + tailwind-merge)
  i18n/
    routing.ts, request.ts, navigation.ts
  middleware.ts             ← next-intl + auth route protection
messages/
  en.json
  fr.json
```

## Agent Rules

`CLAUDE.md` pulls in:
- Frontend-only rules under [`Skills/`](Skills/) — `nextjs-architecture.md`, `tailwind-rules.md`, `dos-and-donts.md`, `setup-baseline.md`, `next-intl.md`, `screenshot-workflow.md`
- Shared product specs under [`../shared-specs/`](../shared-specs/) — `mvp-spec.md`, `design-system-final.md`, feature specs, `data-model-spec.md`

Read `CLAUDE.md` before editing.

## Branch Conventions

Work on `frontend/feat/name` or `frontend/fix/name` branches and open PRs into `dev`.
