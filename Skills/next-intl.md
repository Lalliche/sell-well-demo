# next-intl — Implementation Guide

> This file explains how to set up and use next-intl in this project.
> Follow this exactly. Do not deviate from the file structure or patterns shown here.
>
> **Active locales for SellWell v1: `en` (default) and `fr`. Both LTR — no RTL handling needed.**
>
> The Arabic (`ar`) examples below are kept as forward-looking reference — if/when we add Arabic later, the RTL setup is already documented. **Do not implement Arabic or RTL until explicitly told to.**

---

## Installation

```bash
npm install next-intl
```

---

## File Structure

```
├── messages/
│   ├── en.json
│   └── fr.json          ← (ar.json added later if Arabic is enabled)
├── next.config.ts
└── src/
    ├── middleware.ts
    ├── i18n/
    │   ├── routing.ts
    │   ├── request.ts
    │   └── navigation.ts
    └── app/
        └── [locale]/
            ├── layout.jsx
            └── page.jsx
```

---

## Files & Their Content

### `messages/en.json`
All user-facing English strings. Grouped by section/component.

```json
{
  "Header": {
    "navBar": {
      "Home": "Home",
      "Marketplace": "Marketplace",
      "Pricing": "Pricing",
      "ContactUs": "Contact Us"
    }
  },
  "hero": {
    "title": "Sell smarter. Earn more.",
    "cta": "Become a Sales Partner"
  }
}
```

### `messages/fr.json`
Same structure as `en.json`, all values in French.

```json
{
  "Header": {
    "navBar": {
      "Home": "Accueil",
      "Marketplace": "Marketplace",
      "Pricing": "Tarifs",
      "ContactUs": "Nous contacter"
    }
  },
  "hero": {
    "title": "Vendez plus intelligemment. Gagnez davantage.",
    "cta": "Devenir Sales Partner"
  }
}
```

> Always keep `en.json` and `fr.json` in sync — every key that exists in one must exist in the other. Same rule applies to any future locale file (`ar.json`, etc.).

### `messages/ar.json` (forward-looking — not active in v1)

Same structure as `en.json`, all values in Arabic. RTL language.

```json
{
  "Header": {
    "navBar": {
      "Home": "الصفحة الرئيسية",
      "Marketplace": "السوق",
      "Pricing": "الأسعار",
      "ContactUs": "اتصل بنا"
    }
  },
  "hero": {
    "title": "بع بذكاء. اربح أكثر.",
    "cta": "كن شريك مبيعات"
  }
}
```

---

### `src/i18n/routing.ts`

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});
```

> When Arabic is added later, append `"ar"` to the `locales` array. The locale list is the single source of truth — never hardcode locale strings outside this file.

---

### `src/i18n/request.ts`

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as "en" | "fr")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

---

### `src/i18n/navigation.ts`

```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

> Use `Link` and `useRouter` from this file — never from `next/link` or `next/navigation` directly in components that need locale-aware navigation.

---

### `src/middleware.ts`

```ts
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware({
  ...routing,
  localeDetection: true,
});

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\.).*)"],
};
```

---

### `next.config.ts`

```ts
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

---

### `src/app/[locale]/layout.jsx` — V1 Setup (en/fr, LTR only)

This is the **only** layout — there is NO `app/layout.tsx` at the root. This layout owns everything: `<html>`, `<body>`, fonts, metadata, and `NextIntlClientProvider`.

Key rules:
- Use `hasLocale` (not `routing.locales.includes()`) for locale validation.
- Load messages via direct `import()` — pass `locale` explicitly to provider.
- `params` is a `Promise` — always `await` it.
- v1: both locales are LTR — `<html>` does not need a dynamic `dir`.

```jsx
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Sora, DM_Sans, IBM_Plex_Mono } from "next/font/google";
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
  description: "The first B2B tech sales partner platform in Algeria.",
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
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

> **No `app/layout.tsx`** — next-intl projects do not have a root layout. All routes go through `[locale]` (enforced by middleware), so this layout covers everything.

---

### Forward-Looking — Layout When Arabic Is Added

When Arabic is enabled, swap the layout to apply `dir="rtl"` and a locale-aware font. Add the Arabic font, compute `isRTL`, and gate the body font on it:

```jsx
import { Sora, DM_Sans, IBM_Plex_Mono, Noto_Naskh_Arabic } from "next/font/google";

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// inside LocaleLayout:
const isRTL = locale === "ar";

return (
  <html
    lang={locale}
    dir={isRTL ? "rtl" : "ltr"}
    suppressHydrationWarning
    className={`${sora.variable} ${dmSans.variable} ${ibmPlexMono.variable} ${notoNaskhArabic.variable} h-full antialiased`}
  >
    <body
      className={`min-h-full flex flex-col text-[12px] md:text-[14px] lg:text-[15px] xl:text-[16px] ${
        isRTL ? "font-(--font-arabic)" : "font-(--font-body)"
      }`}
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </body>
  </html>
);
```

When you reach this point, also:
1. Add `"ar"` to `routing.locales` in `routing.ts`.
2. Update the type guard in `request.ts` (`"en" | "fr" | "ar"`).
3. Create `messages/ar.json` mirroring every key.
4. Audit components for layout-specific RTL adjustments (icon direction, text alignment overrides).

---

### `src/app/[locale]/page.jsx`

Page is a Client Component only if it needs interactivity. Otherwise keep it a Server Component.

```jsx
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingCTA from "@/components/landing/LandingCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <LandingCTA />
    </>
  );
}
```

---

## Using Translations in Components

### Client Components (`"use client"`)

```jsx
"use client";
import { useTranslations } from "next-intl";

export default function Hero() {
  const t = useTranslations("hero");

  return (
    <section>
      <h1>{t("title")}</h1>
      <button>{t("cta")}</button>
    </section>
  );
}
```

### Server Components (default)

```jsx
import { getTranslations } from "next-intl/server";

export default async function Features() {
  const t = await getTranslations("features");

  return (
    <section>
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>
    </section>
  );
}
```

---

## Locale-Aware Navigation

Use `Link` and `useRouter` from `@/i18n/navigation` — they automatically prepend the current locale to internal paths.

```jsx
import { Link } from "@/i18n/navigation";

<Link href="/marketplace">{t("navBar.Marketplace")}</Link>
// renders → <a href="/en/marketplace"> when locale = en
//        → <a href="/fr/marketplace"> when locale = fr
```

Never use `next/link` directly inside a `[locale]`-routed page.

---

## RTL Handling (forward-looking)

When Arabic is enabled, RTL is handled at the `<html>` level via `dir="rtl"` (see Forward-Looking layout above). Inside components:

- Check `useLocale() === "ar"` only for layout-specific adjustments (icon direction, chevron flips, text alignment overrides on a specific element).
- Never hardcode `dir` on individual components unless overriding a specific element.
- For RTL-conditional logic, prefer logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`) over checking the locale in JS.

In v1 (en/fr only), do **not** write any RTL-conditional code. It's dead weight until Arabic ships.

---

## Hard Rules

- **Never hardcode strings in JSX** — every user-facing string goes through `t()`. Exception: values that don't change between locales (numbers, brand names, technical identifiers).
- **Always add keys to all active locale files at the same time** — never leave one out of sync. v1: `en.json` + `fr.json`. Future: `ar.json` joins this rule.
- The `[locale]` folder wraps everything — there is no `app/page.jsx` at the root level.
- `routing.ts` is the single source of truth for the locale list — never hardcode `"en"`, `"fr"`, or any locale string elsewhere.
- v1 has no RTL — do not add `dir` handling, locale-conditional fonts, or RTL-only CSS until Arabic is enabled.
