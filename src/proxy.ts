import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import {
  readRoleFromCookieHeader,
  type SellwellRole,
} from "./lib/auth-cookie";

/**
 * Single source of truth for who can see what. Edge-runtime middleware reads
 * the role cookie set by the mock-auth layer (and, in Phase 11+, by the real
 * Django session-decode). Non-admin or anonymous traffic hitting a protected
 * route is rewritten to the locale-level 404 — same screen as a typo'd URL,
 * no in-shell card, no information leak that admin routes exist.
 *
 * Composed AFTER next-intl's locale middleware so locale detection still
 * works (anonymous users still get sent to /en/login, not /login).
 */

const intlMiddleware = createIntlMiddleware({
  ...routing,
  localeDetection: true,
});

/** Top-level segments (without locale prefix) that require auth + a specific
 *  role set. The longest matching prefix wins. */
const PROTECTED_TREES: Array<{
  prefix: string;
  allow: readonly SellwellRole[];
}> = [
  { prefix: "/admin", allow: ["admin"] },
  // Authenticated app tree — every signed-in role can hit these; anonymous
  // traffic gets the 404 shell. Per-feature visibility (e.g. partner-only
  // /partner-links) is enforced inside the page via the existing role-branch
  // routers; this middleware only blocks "you must be signed in to be here."
  { prefix: "/dashboard", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/marketplace", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/campaigns", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/applications", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/leads", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/partner-links", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/escrow", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/notifications", allow: ["admin", "sales_partner", "company"] },
  { prefix: "/earnings", allow: ["admin", "sales_partner", "company"] },
  // `/settings` was removed 2026-05-13 — General tab moved into the
  // Profile detail overlay, Notifications tab moved into /notifications
  // as a second tab. A hit on /settings now falls through to Next.js's
  // standard 404 instead of being caught by the role gate.
];

/** Strip the leading `/en` or `/fr` (or any future locale) so the protected-
 *  tree match runs on the canonical app path. */
function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}`) return "/";
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(locale.length + 1);
  }
  return pathname;
}

/** First protected tree whose prefix matches this path, or null when the path
 *  is public (landing, auth screens, etc.). */
function matchProtectedTree(pathWithoutLocale: string) {
  for (const tree of PROTECTED_TREES) {
    if (
      pathWithoutLocale === tree.prefix ||
      pathWithoutLocale.startsWith(`${tree.prefix}/`)
    ) {
      return tree;
    }
  }
  return null;
}

/** Pull the locale segment off the request — used to rewrite to the correct
 *  locale-scoped 404. Falls back to defaultLocale when the URL is somehow
 *  unprefixed (the intl middleware should have prevented this, but be safe). */
function detectLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export default function middleware(request: NextRequest) {
  // 1. Run next-intl FIRST — handles locale detection / redirect from `/foo`
  //    to `/en/foo`. If it returns a redirect response, return it as-is so
  //    the browser gets the localized URL before we try to gate it.
  const intlResponse = intlMiddleware(request);
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // 2. Now run the role gate against the (already-localized) path.
  const pathname = request.nextUrl.pathname;
  const pathWithoutLocale = stripLocale(pathname);
  const tree = matchProtectedTree(pathWithoutLocale);

  if (!tree) {
    // Public path (landing, /login, /signup, etc.) — pass through.
    return intlResponse;
  }

  const role = readRoleFromCookieHeader(request.headers.get("cookie"));
  const allowed = role !== null && tree.allow.includes(role);

  if (allowed) {
    return intlResponse;
  }

  // Unauthorized: rewrite to a sentinel path under the locale's catch-all
  // route (`[...rest]/page.jsx` calls notFound(), which renders the existing
  // locale-level not-found.jsx with full design-system chrome). The URL the
  // user typed stays in the address bar; response status is 404.
  const locale = detectLocale(pathname);
  const notFoundUrl = request.nextUrl.clone();
  notFoundUrl.pathname = `/${locale}/__not_found__`;
  return NextResponse.rewrite(notFoundUrl, { status: 404 });
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
