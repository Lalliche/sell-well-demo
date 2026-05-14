/**
 * Pure helpers for /partner-links/performance — keeps the page file
 * lean and lets the test suite cover the windowing logic without
 * mounting React.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Map a preset key (`7d` / `30d` / `90d` / `all`) to a `sinceISO` the
 *  mock layer can window against. `all` returns null so the mock
 *  short-circuits and returns the all-time rollup. */
export function rangeToISO(key) {
  if (key === "all") return null;
  const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
  return new Date(Date.now() - days * DAY_MS).toISOString();
}
