# Setup Baseline — SellWell Client

> The current state of the SellWell client is a fresh Next.js 16.2 boilerplate. This file describes the **baseline edits** required to bring it in line with the project's house standard before any feature work begins.
> Reference only — agents do not auto-execute these steps. They run when explicitly told to bootstrap the project.

---

## Current State (as of file creation)

| File | Current | Target |
|---|---|---|
| `src/app/layout.tsx` | Geist + Geist Mono fonts, `<body className="min-h-full flex flex-col">`, no responsive base | **Deleted** — replaced by `src/app/[locale]/layout.jsx` |
| `src/app/page.tsx` | Default Next.js boilerplate | **Deleted** — replaced by `src/app/[locale]/page.jsx` |
| `src/app/globals.css` | Default `--background`/`--foreground` boilerplate, no breakpoints, no design tokens | Rewritten with the `@theme inline {}` block translating `design-system-final.md` |
| `src/middleware.ts` | Does not exist | Created — runs `next-intl` middleware (and later, auth-cookie checks) |
| `messages/en.json`, `messages/fr.json` | Do not exist | Created with starter keys |
| `src/i18n/routing.ts`, `request.ts`, `navigation.ts` | Do not exist | Created per `next-intl.md` |
| `next.config.ts` | Default | Wrapped with `createNextIntlPlugin()` |
| `package.json` | next 16.2, react 19.2, tailwindcss 4 only | Adds `next-intl`, `clsx`, `tailwind-merge`, `motion`, `react-icons`, `lucide-react`, `@tanstack/react-query`, `axios` |

---

## Step 1 — Install Dependencies

```bash
npm install next-intl clsx tailwind-merge motion react-icons lucide-react @tanstack/react-query axios
```

Versions: pin nothing — let npm pick the latest compatible. If a future Next.js / React 19 incompatibility surfaces, adjust then.

---

## Step 2 — i18n Plumbing

Follow [next-intl.md](./next-intl.md) end-to-end:

1. Create `messages/en.json` and `messages/fr.json` with at least a `Common` namespace (page titles, generic CTAs).
2. Create `src/i18n/routing.ts`, `request.ts`, `navigation.ts` per the exact code in `next-intl.md`.
3. Create `src/middleware.ts` running `createMiddleware({ ...routing, localeDetection: true })`.
4. Wrap `next.config.ts` with `createNextIntlPlugin()`.

---

## Step 3 — Move Layout & Page Under `[locale]`

**Delete:**
- `src/app/layout.tsx`
- `src/app/page.tsx`

**Create `src/app/[locale]/layout.jsx`** — note `.jsx` per the JS/TS policy:

```jsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Sora, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import QueryProvider from "@/components/providers/QueryProvider";
import "../globals.css";

const sora = Sora({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "SellWell — B2B Tech Sales Partners in Algeria",
  description:
    "The first B2B tech sales partner platform in Algeria. Connect with professional sales partners and grow without hiring a full sales team.",
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) notFound();

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${sora.variable} ${dmSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px] font-(--font-body)">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Create `src/app/[locale]/page.jsx`** as a placeholder until the `(landing)` route group is built:

```jsx
export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <p className="text-[1em] text-text-muted">SellWell — coming soon.</p>
    </main>
  );
}
```

---

## Step 4 — Rewrite `globals.css`

Replace the boilerplate `globals.css` with the full design-system translation. Required sections in order:

1. `@import "tailwindcss";`
2. `@theme inline {}` — breakpoints, colors, fonts, shadow vars, all `--color-*` tokens translated from `design-system-final.md`.
3. `:root {}` — non-Tailwind vars (status colors, trends, etc.).
4. Base styles (`html`, `body`, `*`, scrollbar).
5. `@keyframes` (skeleton-pulse, fade-up, marquee — add as needed).
6. `prefers-reduced-motion` block.
7. `.shadow-xs / sm / md / lg / xl` utility mappings (referencing CSS vars).

**Skeleton:**

```css
@import "tailwindcss";

@theme inline {
  /* Breakpoints */
  --breakpoint-xs:   500px;
  --breakpoint-sm:   640px;
  --breakpoint-md:   850px;
  --breakpoint-lg:   1150px;
  --breakpoint-xl:   1350px;
  --breakpoint-xxl:  1800px;
  --breakpoint-xxxl: 2200px;

  /* Background & Surfaces */
  --color-bg:             #FAF9F6;
  --color-bg-alt:         #F2F1ED;
  --color-surface:        #FFFFFF;
  --color-surface-hover:  #F7F6F3;

  /* Borders */
  --color-border:         #E5E3DF;
  --color-border-light:   #EEEDEA;

  /* Text */
  --color-text:           #1A1A1A;
  --color-text-secondary: #6B6B6B;
  --color-text-muted:     #9E9E9E;

  /* Accent — Steel Blue (the only chromatic color) */
  --color-accent:         #3B6ECC;
  --color-accent-text:    #2B5AA8;
  --color-accent-hover:   #2F5AB0;

  /* CTA */
  --color-cta:            #1A1A1A;
  --color-cta-text:       #FFFFFF;
  --color-cta-hover:      #2A2A2A;

  /* Status — Subtle palette */
  --color-status-approved-bg:   #EDF5F0;
  --color-status-approved-text: #2D6A4F;
  --color-status-pending-bg:    #FDF6E3;
  --color-status-pending-text:  #8B6914;
  --color-status-rejected-bg:   #FBECEC;
  --color-status-rejected-text: #B13B3B;
  --color-status-active-bg:     #ECF0F8;
  --color-status-active-text:   #3B6ECC;

  /* Trends */
  --color-trend-positive: #2D6A4F;
  --color-trend-negative: #B13B3B;

  /* Fonts */
  --font-heading: var(--font-heading), system-ui, sans-serif;
  --font-body:    var(--font-body),    system-ui, sans-serif;
  --font-mono:    var(--font-mono),    ui-monospace, monospace;
}

:root {
  /* Accent alpha variants — kept as :root so opacity composition stays exact */
  --accent-light:  rgba(59, 110, 204, 0.08);
  --accent-border: rgba(59, 110, 204, 0.15);

  /* Hero gradient */
  --bg-gradient: linear-gradient(180deg, #EDF2FA 0%, #FAF9F6 40%);

  /* Shadow tokens */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 6px 20px rgba(0, 0, 0, 0.06);
  --shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.08);
}

html { scroll-behavior: smooth; }

body {
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-family: var(--font-body), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* { box-sizing: border-box; }

/* Scrollbar */
::-webkit-scrollbar       { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--color-bg-alt); }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }

/* Keyframes */
@keyframes skeleton-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.55; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(0.5em); }
  to   { opacity: 1; transform: translateY(0); }
}

/* prefers-reduced-motion — single source of truth */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration:        0.01ms !important;
    animation-iteration-count: 1      !important;
    transition-duration:       0.01ms !important;
    scroll-behavior:           auto   !important;
  }
}

/* Shadow utility mappings */
.shadow-xs { box-shadow: var(--shadow-xs); }
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
```

---

## Step 5 — Create `src/lib/utils.ts` (the `cn()` helper)

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 6 — Scaffold the Components Tree

```
src/components/
  ui/
    Buttons.jsx          ← AppButton with primary/accent/secondary/ghost variants
    FormInputs.jsx       ← TextInput, TextArea, DateInput, DropdownInput
  shared/                ← (empty for now — populated as patterns repeat)
  providers/
    QueryProvider.jsx
  landing/               ← (empty for now — populated when (landing)/page.jsx is built)
  auth/
  marketplace/
  dashboard/
  leads/
  partner-links/
  admin/
```

`AppButton` and `FormInputs` implementations follow the design system specs from `design-system-final.md`:
- **AppButton:** 4 variants (primary/accent/secondary/ghost), 3 sizes (sm/md/lg), `disabled`, `isLoading`, hover lift, focus ring.
- **FormInputs:** controlled, `onChange(value)` contract, label + helper + error states, 44px height, focus ring, error background tint.

---

## Step 7 — Verify

1. `npm run dev` — server starts at `http://localhost:3000`.
2. Visit `http://localhost:3000` — middleware redirects to `/en` (default locale).
3. Visit `http://localhost:3000/fr` — French locale is served.
4. Inspect the body element — confirm `text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px]` is present.
5. Inspect computed styles — confirm `--color-accent: #3B6ECC` and `--color-bg: #FAF9F6` are available.
6. Confirm no Tailwind class warnings in the terminal.
7. Confirm `globals.css` contains nothing component-specific.

After Step 7 passes, the project is ready for feature work. Build the first `(landing)/page.jsx` next.
