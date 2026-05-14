/**
 * Currency formatting for DZD (Algerian Dinar) values across the dashboard.
 *
 * The design system requires IBM Plex Mono for all monetary values, so the
 * caller is responsible for the font — these helpers only handle the
 * number → string formatting (locale grouping, decimal handling, compact
 * notation for large values).
 *
 * `format(value, opts)` — full precision: "DZD 48,200" (default).
 * `formatCompact(value)` — large numbers: "DZD 48.2K", "DZD 1.2M".
 * `formatNumber(value)` — bare integer with locale grouping: "1,234".
 */

const FULL = new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 });
const COMPACT = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function format(value, { withSymbol = true } = {}) {
  if (value == null || Number.isNaN(value)) return "—";
  const n = FULL.format(value);
  return withSymbol ? `DZD ${n}` : n;
}

export function formatCompact(value, { withSymbol = true } = {}) {
  if (value == null || Number.isNaN(value)) return "—";
  const n = COMPACT.format(value);
  return withSymbol ? `DZD ${n}` : n;
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return "—";
  return FULL.format(value);
}
