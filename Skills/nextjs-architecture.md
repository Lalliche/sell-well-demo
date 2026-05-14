# Next.js Architecture — SellWell Client

> The structural contract for the SellWell client. Read this first, every session, before touching any UI code.
> For *how* to write Tailwind (units, layout, animations, shadows, global-CSS discipline), read [tailwind-rules.md](./tailwind-rules.md).
> For brand values (colors, typography, spacing tokens), read [design-system-final.md](./design-system-final.md) — it always wins on visual decisions.
> For i18n setup and usage, read [next-intl.md](./next-intl.md).
> For product scope and user flows, read [mvp-spec.md](./mvp-spec.md).

---

## Project Stack

| Item | Value |
|---|---|
| Framework | Next.js **16.2** (App Router, React 19) — see `package.json` for the exact version |
| Styling | Tailwind CSS **v4** — config lives in `src/app/globals.css` via `@theme {}` block. **No `tailwind.config.js`** |
| Components | `.jsx` for components, `.tsx` only for typed utilities (e.g. `lib/utils.ts`, `types/`, config files) |
| Animations | `motion` (framer-motion fork) — for cinematic moments only, not every div |
| Icons | `react-icons` (primary) + `lucide-react` (secondary). The design system says "Lucide" — both are allowed; prefer Lucide for product UI, react-icons for brand/social marks |
| i18n | `next-intl` v4 — locales: `en` (default), `fr`. **Locale-first routing from day one** |
| Class utility | `cn()` from `@/lib/utils` (clsx + tailwind-merge) — always use it for conditional classNames. Never string-concatenate. |
| Server state | `@tanstack/react-query` — see React Query section |

> ⚠️ Next.js 16 has breaking changes from earlier versions (see `AGENTS.md`). When unsure, read `node_modules/next/dist/docs/` before writing route handlers, layouts, or middleware — do not rely on memory of older Next.js APIs.

---

## Routing — Locale-First, Always

There is **NO `app/layout.tsx`** at the root. Every route lives under `app/[locale]/`. The middleware enforces this — see `next-intl.md` for the full setup.

### Route Group Layout

Inside `[locale]/`, separate concerns with route groups so each area can own its layout (navbar, sidebar, etc.):

```
src/app/[locale]/
  layout.jsx              ← html/body, fonts, NextIntlClientProvider, providers
  page.jsx                ← redirect to (landing)/page.jsx OR render landing directly
  (landing)/
    layout.jsx            ← public navbar + footer
    page.jsx              ← Hero + Features + HowItWorks + ...
  (auth)/
    layout.jsx            ← split-screen / centered auth shell
    login/page.jsx
    signup/page.jsx
  (app)/
    layout.jsx            ← sidebar + header (shared by partner & company dashboards)
    dashboard/page.jsx
    marketplace/page.jsx
    leads/page.jsx
    earnings/page.jsx
  (admin)/
    layout.jsx            ← admin shell (only visible to SellWell team)
    page.jsx
```

**Hard rules:**
- Never put components inline in `page.jsx`. Split into `components/landing/`, `components/dashboard/`, etc. (See Components Tree.)
- The `[locale]` segment is mandatory — every route inherits it.
- For internal links use `Link` from `@/i18n/navigation` (see `next-intl.md`). **Never** raw `<a>` or `next/link` directly.

---

## Components Tree — Feature-Based

```
src/components/
  ui/              ← atomic primitives (single source of truth)
    Buttons.jsx          ← AppButton — every <button> in the project
    FormInputs.jsx       ← TextInput, TextArea, DateInput, DropdownInput
    glass-button.tsx     ← shadcn-style atoms use kebab-case
  shared/          ← anything used in 2+ places. Extract on the second use.
    Skeleton.jsx
    StatusBadge.jsx
    StatCard.jsx
    ConfirmPopup.jsx
  providers/       ← QueryProvider, AuthProvider, ToastProvider — client wrappers
  landing/         ← public-facing landing sections
    Hero/index.jsx + sub-components
    Features/index.jsx
    HowItWorks/index.jsx
    Testimonials/index.jsx
    LandingCTA/index.jsx
  auth/            ← login, signup, password reset components
  marketplace/     ← program list, ProgramCard, filters, application flow
  dashboard/       ← partner & company dashboard widgets
  leads/           ← lead list, LeadCard, LeadForm, status pills
  partner-links/   ← link generator, link analytics components
  admin/           ← SellWell-team-only components
```

**Naming:**
- PascalCase for everything we author (`ProgramCard.jsx`, `LeadForm.jsx`, `DashboardSidebar.jsx`).
- kebab-case allowed for shadcn-imported atoms (`glass-button.tsx`) so paste-from-shadcn keeps working.
- Folder-per-module: when a section grows past one file, convert to a folder with `index.jsx` as the entry — sub-components live alongside, never nested deeper than one level.

**Component splitting heuristic:**
- A component growing past **~150 lines** is a signal to consider splitting.
- Do **not** split a component under **~80 lines** unless there's a clear reuse reason.
- Split when: a chunk has its own state, is reused in 2+ places, or makes the parent hard to read.
- One focused 120-line component beats three 40-line ones that only exist together.

**No-duplicate rule (top-level):**
Any markup pattern, class string, or component used in more than one place must be extracted to `src/components/shared/`. Zero tolerance. Catch yourself copying a card shell, filter bar, or stats row across two files → stop and extract.

---

## Root Layout — Required `<body>` className

The body element in `src/app/[locale]/layout.jsx` must always carry this className for responsive base typography:

```jsx
<body className="min-h-full flex flex-col text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px]">
```

This is the **single point** that rescales the entire UI per breakpoint. Every component sizes in `em` downstream → changing this one value scales everything proportionally. See `tailwind-rules.md` for the full unit policy.

**Treat `design-system-final.md`'s pixel sizes as reference values at the `xl` breakpoint** (where base = 16px). Implement them in `em`: `--body: 16px` → `text-[1em]` at xl, naturally scaled down at smaller breakpoints by the body className.

---

## globals.css — What Lives There

`src/app/globals.css` should contain **only**:

1. `@import "tailwindcss";`
2. The `@theme inline {}` block — design tokens from `design-system-final.md` translated to Tailwind v4 CSS variables (colors, breakpoints, fonts, shadow vars).
3. `:root {}` — non-Tailwind CSS variables (anything not consumed as a Tailwind utility).
4. Base element styles: `html`, `body`, `*`, scrollbar, font smoothing.
5. `@keyframes` definitions for animations that loop or need keyframe control.
6. The shadow utility mappings (`.shadow-xs / .shadow-sm / ... / .shadow-xl`) — they reference CSS vars.
7. The `prefers-reduced-motion` block — single source of truth for motion preferences.

**Required breakpoints (always present, never modified):**

```css
@theme inline {
  --breakpoint-xs:   500px;
  --breakpoint-sm:   640px;
  --breakpoint-md:   850px;
  --breakpoint-lg:   1150px;
  --breakpoint-xl:   1350px;
  --breakpoint-xxl:  1800px;
  --breakpoint-xxxl: 2200px;
}
```

> The design system lists `sm/md/lg/xl/2xl` at different widths. **The architecture breakpoints above win** for layout (they map to fluid scaling). Use the design system's breakpoint widths only as reference for component-level decisions (e.g., "stat cards: 1 column below sm").

**Never put component-specific classes (`.hero-heading-grad`, `.step-card-wrap`, etc.) in `globals.css`.** If Tailwind can express it, write it inline. If state-driven, use `style={{}}`. If it needs a keyframe, define `@keyframes` here but apply via inline `animation:` or a single arbitrary utility. See `tailwind-rules.md` for the full policy.

---

## Server vs Client Components

- **Server components by default.** Add `'use client'` only when the component uses `useState`, `useEffect`, event handlers, or browser APIs.
- Use `next/image` (`<Image />`) for all images — **never** raw `<img>`.
- Brand assets (logos, illustrations, custom images) → `src/assets/`, imported via ES modules so Next.js can hash + optimize them. Files served by URL (`favicon.ico`, `robots.txt`, OG share images, marketing screenshots) → `public/`.
- Load fonts via `next/font/google` in `[locale]/layout.jsx` — never via CDN `<link>` tags. The design system's three fonts (Sora, DM Sans, IBM Plex Mono) are loaded with their declared weights.

### `setState` in `useEffect` — Hard Rule

The body of `useEffect` runs after render. Calling `setState` synchronously there schedules an immediate re-render, causes cascading renders, hurts performance, and React 19 flags it as an error (`react-hooks/set-state-in-effect`).

`setState` **inside callbacks** is fine — event handlers, `setTimeout`, `requestAnimationFrame`, `Promise.then`, subscription handlers. The rule is only about *synchronous* calls in the effect body.

```jsx
// ❌ WRONG — synchronous setState in effect body
useEffect(() => {
  if (window.someFlag) setReady(true);
}, []);

// ❌ WRONG — deriving state from props in effect
useEffect(() => {
  setActiveIndex(Math.round(progress * total));
}, [progress, total]);

// ✅ RIGHT — setState in a callback
useEffect(() => {
  const handler = () => setReady(true);
  window.addEventListener("event", handler);
  return () => window.removeEventListener("event", handler);
}, []);

// ✅ RIGHT — defer with rAF / setTimeout when needed on mount
useEffect(() => {
  if (!window.someFlag) return;
  const raf = requestAnimationFrame(() => setReady(true));
  return () => cancelAnimationFrame(raf);
}, []);

// ✅ RIGHT — derive during render, not in an effect
const activeIndex = Math.round(progress * total);
```

Assigning to a `ref` from state inside an effect is fine — refs don't trigger renders.

### Lazy Loading

Use `next/dynamic` with `{ ssr: false }` (or `React.lazy`) for below-the-fold heavy sections on long pages. The landing page has multiple sections — only the hero and navbar load immediately; everything else lazy-loads on scroll. Also lazy-load heavy components (modals, video players, charts). Always-visible layout (Navbar, Footer, sidebar) does **not** need lazy loading.

---

## Buttons — `AppButton` (Single Source of Truth)

All buttons in the project go through `AppButton`. **Never create ad-hoc `<button>` elements with inline styles.**

**Location:** `src/components/ui/Buttons.jsx`

**Variants** map directly to `design-system-final.md` button specs:

| Variant | DS Mapping | Use |
|---|---|---|
| `primary` | `--cta` (#1A1A1A) bg, white text | Main action per screen. One per view. |
| `accent` | `--accent` (#3B6ECC) bg, white text | Confirm sale, financial actions. |
| `secondary` | transparent bg, 1px `--border`, `--text` | Secondary actions. |
| `ghost` | transparent bg, `--text-secondary` | Tertiary actions, cancel. |

```jsx
// ❌ Wrong — never create ad-hoc buttons
<button className="bg-black text-white px-4 py-2 rounded-lg">Confirm Sale</button>

// ✅ Correct — always use AppButton
import AppButton from "@/components/ui/Buttons";

<AppButton variant="primary"   onClick={handleConfirm}>Confirm Sale</AppButton>
<AppButton variant="accent"    onClick={handleSubmit} disabled={isLoading}>Submit Lead</AppButton>
<AppButton variant="secondary" onClick={handleCancel}>Cancel</AppButton>
<AppButton variant="ghost"     onClick={handleSkip}>Skip</AppButton>
```

Sizes: `sm` (32px) · `md` (40px, default) · `lg` (48px) — per the design system.
States: hover (slight darken + `translateY(-1px)`), active (darken further), disabled (50% opacity), focus-visible (2px ring in `--accent-border`).

Pass `disabled`, `isLoading`, `size`, `className` as needed. **Never re-style a variant from outside** — modify `Buttons.jsx` if a variant needs updating.

---

## Form Inputs — `FormInputs` (Single Source of Truth)

All form inputs live in `src/components/ui/FormInputs.jsx` and are used as controlled components.

```jsx
import { TextInput, TextArea, DateInput, DropdownInput } from "@/components/ui/FormInputs";

<TextInput
  label="Full name"
  placeholder="Enter your name"
  value={value}
  onChange={setValue}          // receives the value directly — not the event object
  disabled={!isEditing}
  required
  errorMessage="This field is required."
  regex={/^[a-z]+$/}
/>

<TextArea label="Conversation notes" value={notes} onChange={setNotes} rows={4} />

<DateInput
  label="Sale date"
  value={dateStr}              // YYYY-MM-DD string
  onChange={setDateStr}
  minDate="2024-01-01"
/>

<DropdownInput
  label="Product"
  options={[{ value: "id", label: "Display name" }]}
  value={selectedValue}
  onChange={setSelectedValue}
  multi={false}
/>
```

**Key rule:** `onChange` always receives the **value directly** — not `e.target.value`. All inputs follow this contract.

Inputs follow `design-system-final.md` spec: 44px height, `--surface` bg, `--border` border, focus → `--accent` border + `--accent-border` ring (3px), error → `#B13B3B` border + `#FBECEC` bg, label 14px DM Sans 500.

---

## cn() — Conditional ClassNames

Always use `cn()` from `@/lib/utils` for conditional or composed classNames. Never string-concatenate.

```jsx
import { cn } from "@/lib/utils";

// ❌ Wrong — string concatenation breaks with complex conditions
className={"base-class " + (isActive ? "text-accent" : "text-text-muted")}

// ✅ Correct — cn() handles merging, deduplication, and conditional logic
className={cn(
  "flex items-center gap-[0.5em] p-[0.75em] rounded-[0.5em]",
  isActive && "bg-accent-light text-accent-text border-l-2 border-accent",
  isDisabled && "opacity-50 cursor-not-allowed"
)}
```

---

## State Management

- **No global state manager** — no Redux, no Zustand.
- **`useState`** handles local UI state only (modals, toggles, form values).
- **Context API** kicks in when 3+ components need the same data (auth user, theme, locale-derived values). Live in `src/components/providers/`.
- **React Query** handles all server state (fetching, caching, mutations).
- Pass data down via props; communicate up via callback props (`onEdit`, `onSave`, `onDelete`, etc.).

### React Query

Wrap the app in a `QueryProvider` client component:

```jsx
// src/components/providers/QueryProvider.jsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

export default function QueryProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

Mounted once inside `[locale]/layout.jsx`. Use `useQuery` and `useMutation` inside components. Keep query keys as arrays: `["programs"]`, `["programs", id]`, `["leads", { partnerId, status }]`.

---

## API Calls

> ⚠️ **Do not connect real API calls until explicitly told to.** Until then, use async mock modules wired via React Query — never inline data in components.

```jsx
// ❌ Wrong — data hardcoded in component, requires rewrite when backend ships
const programs = [{ id: "1", name: "Atlas CRM", commissionRate: 10 }];

// ✅ Correct — mock module + React Query, body-swap-only when backend ships
// src/lib/mock/campaigns.js
// fetchCampaigns() → GET /api/campaigns/
export async function fetchCampaigns(filters = {}) {
  await sleep(280);
  return MOCK_CAMPAIGNS.filter(...);
}

// In component — zero changes needed when backend ships
const { data: programs, isLoading } = useQuery({
  queryKey: ["campaigns", filters],
  queryFn: () => fetchCampaigns(filters),
});
```

When API integration is requested:

- All API calls go through `axios` with a configured base instance.
- Base instance lives in `src/lib/api.js` — sets `baseURL`, `withCredentials: true`, attaches CSRF token via interceptor.
- `GET` requests use `useQuery`. `POST/PUT/DELETE` use `useMutation`.
- **Never call `axios` directly inside a component** — always wrap in a function in `src/lib/` or a custom hook.

```js
// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const csrf = getCookie("csrftoken");
  if (csrf) config.headers["X-CSRFToken"] = csrf;
  return config;
});

export default api;
```

---

## Authentication

> ⚠️ **Do not implement auth logic until explicitly told to.** Default to mock session state in components.

When auth integration is requested:

- Session-based auth (cookie + CSRF, Django-style backend).
- Auth functions live in `src/lib/Auth.js`: `loginUser()`, `logoutUser()`, `fetchCurrentUser()`.
- `middleware.ts` at the root level protects routes by checking session cookies (and applies the `next-intl` locale middleware — they compose).
- CSRF token auto-attached via the Axios interceptor (see API section).
- 401/403 responses handled globally in the Axios interceptor — auto-redirect to `/[locale]/login`.

---

## Error Handling

- Axios interceptor handles 401/403 globally (auto-redirect).
- Form inputs validate `onBlur` — error message appears inline below the field via `FormInputs`.
- API call errors caught in `try/catch` — shown via a `StatusMessage` or `ValidationBanner` component in `src/components/shared/`.
- **Destructive actions** (delete, suspend, reject, cancel sale) require confirmation via a `ConfirmPopup` component before proceeding. See `mvp-spec.md` for which flows are destructive.
- **Financial actions** (confirm sale, payout, commission decline) — toasts must NOT auto-dismiss. Manual dismissal only. (Per design system anti-pattern §5.)

---

## i18n Rules

- Read `next-intl.md` first — it is the implementation guide.
- All user-facing strings go through `useTranslations()` (client) or `getTranslations()` (server) — **no hardcoded text in JSX** unless the value never changes between locales (numbers, brand names).
- Add new keys to **both** `messages/en.json` and `messages/fr.json` at the same time — never leave one out of sync.
- For locale-aware navigation use `Link` and `useRouter` from `@/i18n/navigation` — never `next/link` or `next/navigation` directly.
- Both locales are LTR. No RTL handling is needed in v1.

---

## Screenshot Workflow

Screenshot mechanics (puppeteer setup, comparison loops, viewport, helper scripts) live in [screenshot-workflow.md](./screenshot-workflow.md). **Do not implement the screenshot workflow until explicitly told to** — it's an opt-in tool for visual validation against references, not a default step.

---

## Anti-Generic Guardrails

- **Never** use default Tailwind palette colors (`indigo-500`, `blue-600`, `slate-300`…) — use only tokens from `design-system-final.md`.
- **Never** introduce a second chromatic color. Steel blue (`--accent`) is the only accent.
- **Never** use raw black (`#000000`) for text or pure white (`#FFFFFF`) for page background. Use `--text` (#1A1A1A) and `--bg` (#FAF9F6).
- **Never** use gradients on buttons.
- **Never** use the same font for headings and body — Sora for headings, DM Sans for body, IBM Plex Mono for numbers.
- **Never** call `setState` synchronously inside `useEffect` body.
- **Never** create ad-hoc buttons — always use `AppButton`.
- **Never** create standalone input elements — always use `FormInputs`.
- **Never** put component-specific classes in `globals.css` — write them inline.
- **Never** duplicate code — extract to `src/components/shared/` the moment a pattern appears twice.
- **Never** use `<img>` — always `<Image />` from `next/image`.
- **Never** hardcode locale strings in JSX — always `useTranslations()`.
- **Never** use raw `<a>` or `next/link` directly inside `[locale]` routes — use `@/i18n/navigation`.
- **Every** clickable element must have `hover:`, `focus-visible:`, and `active:` states.
