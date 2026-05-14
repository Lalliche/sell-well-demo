/**
 * Relative-time formatter for notification rows + activity logs.
 *
 * Returns a localized string like "just now" / "5m ago" / "2h ago" /
 * "3d ago" / "Apr 14" depending on how far in the past the timestamp is.
 *
 * Why a hand-rolled helper instead of `next-intl`'s `format.relativeTime`:
 * the design system wants compact units ("5m" not "5 minutes"). Built-in
 * Intl.RelativeTimeFormat doesn't expose abbreviated units. So we drive
 * the unit selection here and let i18n provide the labels.
 *
 * Caller must pass a translator scoped to `Dashboard.Notifications.Time.*`
 * (or a compatible namespace) so this stays locale-aware.
 *
 * Param `t` keys consumed:
 *   justNow              "just now"
 *   minsAgo  { count }   "5m ago"   (handles plural via ICU MessageFormat)
 *   hoursAgo { count }   "2h ago"
 *   daysAgo  { count }   "3d ago"
 *
 * For timestamps older than 7 days, returns the locale's short date string.
 */
export function formatRelative(iso, t) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const delta = Math.max(0, now - then);
  const mins  = Math.floor(delta / 60_000);
  const hours = Math.floor(delta / 3_600_000);
  const days  = Math.floor(delta / 86_400_000);

  if (mins < 1)   return t("justNow");
  if (mins < 60)  return t("minsAgo",  { count: mins });
  if (hours < 24) return t("hoursAgo", { count: hours });
  if (days < 7)   return t("daysAgo",  { count: days });
  return new Date(iso).toLocaleDateString();
}
