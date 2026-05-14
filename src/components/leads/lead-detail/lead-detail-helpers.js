/**
 * Lead-detail formatting + derivation helpers.
 *
 * Pure functions, no React. Used by the overlay's section components and
 * the orchestrator itself. Lives next to the components that use them
 * inside `lead-detail/` so the parent overlay stays clean.
 */

export const EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;

export function formatAbsolute(iso, locale) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatShortDate(iso, locale) {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function fmtDA(n) {
  if (typeof n !== "number") return "—";
  return Number(n).toLocaleString("fr-DZ");
}

/**
 * Days remaining until `iso`, relative to a caller-provided `now`.
 * `now` must be passed by the caller so this stays pure — React 19's
 * lint flags `Date.now()` called inside render, so the impure read
 * lives in the component once and gets passed down.
 */
export function daysLeft(iso, now) {
  if (!iso) return null;
  const remaining = new Date(iso).getTime() - now;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / 86_400_000);
}

/** Same purity rule — caller passes `now`. */
export function msUntil(iso, now) {
  if (!iso) return null;
  return new Date(iso).getTime() - now;
}
