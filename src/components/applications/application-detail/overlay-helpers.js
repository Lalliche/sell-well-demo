/**
 * Pure helpers for the application detail overlay.
 *
 * `now` is passed in by callers so render functions stay free of impure
 * `Date.now()` reads (React 19 lints these).
 */

/** PlatformSetting.reapplication_cooldown_days (default 30). Hardcoded
 *  here as the mock — real value will arrive from the platform settings
 *  endpoint or on the application payload. */
export const REAPPLY_COOLDOWN_DAYS = 30;

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

export function daysUntilCooldownEnds(reviewedAt, now) {
  if (!reviewedAt) return null;
  const end = new Date(reviewedAt).getTime() + REAPPLY_COOLDOWN_DAYS * 86_400_000;
  const remaining = Math.ceil((end - now) / 86_400_000);
  return remaining > 0 ? remaining : 0;
}
