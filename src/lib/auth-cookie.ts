/**
 * Role cookie shim — bridges the mock-auth-in-localStorage gap so middleware
 * (edge runtime, no DOM, no localStorage) can know who's logged in.
 *
 * Mock era: client JS writes `sellwell_role=admin|sales_partner|company` on
 * every login / role-switch / logout. Middleware reads it from the request
 * cookie header.
 *
 * Phase 11 swap: when Django ships, replace `setRoleCookie` / `clearRoleCookie`
 * bodies with no-ops (the real `sessionid` cookie is HttpOnly + Secure and the
 * backend sets it on `POST /api/auth/login/`), and replace
 * `readRoleFromCookieHeader` with a session-decode call. The cookie name +
 * call sites stay identical so the rest of the app doesn't move.
 */

export const ROLE_COOKIE_NAME = "sellwell_role";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days, matches mock session retention

export type SellwellRole = "admin" | "sales_partner" | "company";

const VALID_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "sales_partner",
  "company",
]);

const isBrowser = () =>
  typeof document !== "undefined" && typeof document.cookie === "string";

/** Client-side: write the role cookie. Called from `lib/mock/auth.js` on every
 *  successful login / role-switch. No-op on SSR. */
export function setRoleCookie(role: SellwellRole): void {
  if (!isBrowser()) return;
  if (!VALID_ROLES.has(role)) return;
  document.cookie = `${ROLE_COOKIE_NAME}=${role}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
}

/** Client-side: clear the role cookie. Called from `lib/mock/auth.js` on
 *  `logoutUser`. No-op on SSR. */
export function clearRoleCookie(): void {
  if (!isBrowser()) return;
  document.cookie = `${ROLE_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

/** Client-side: read the role cookie. Returns null when missing / malformed.
 *  Used by `AuthProvider` to re-sync the cookie from localStorage if a stale
 *  dev session pre-dates the shim. */
export function readRoleCookieClient(): SellwellRole | null {
  if (!isBrowser()) return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${ROLE_COOKIE_NAME}=`));
  if (!match) return null;
  const value = match.slice(ROLE_COOKIE_NAME.length + 1);
  return VALID_ROLES.has(value) ? (value as SellwellRole) : null;
}

/** Middleware-side: parse the role from a raw Cookie header string. Avoids
 *  pulling `next/headers` so this stays callable from the edge runtime without
 *  the runtime branching. */
export function readRoleFromCookieHeader(
  cookieHeader: string | null | undefined,
): SellwellRole | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${ROLE_COOKIE_NAME}=`)) continue;
    const value = trimmed.slice(ROLE_COOKIE_NAME.length + 1);
    return VALID_ROLES.has(value) ? (value as SellwellRole) : null;
  }
  return null;
}
