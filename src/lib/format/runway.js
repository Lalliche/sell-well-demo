/**
 * Runway helpers — used on /escrow/fund + /escrow/withdraw to render
 * the "X leads reservable" calculator beneath the amount input.
 *
 * The runway is the **goal-gradient mechanism** the fund + withdraw
 * pages lean on (per the UX research): instead of pushing copy
 * ("Don't miss leads!"), we just show the math — the user sees what
 * their input does to their lead pipeline. Forward on fund (deposit
 * pushes runway up), reversed on withdraw (withdraw pulls runway down).
 *
 * Pure functions — caller passes `avgReservation` so the component
 * stays render-impure-free. When the company has no historical leads
 * yet, callers fall back to `DEFAULT_AVG_RESERVATION_DZD` below.
 */

/** Sensible fallback when the company has no recent reservation data
 *  to derive an average from. Tuned to a typical small-tier campaign:
 *  10% commission on a 30,000 DZD product + 10% platform fee = 6,000.
 *  Backend will return this on the company stats endpoint. */
export const DEFAULT_AVG_RESERVATION_DZD = 6000;

/** How many leads the company can reserve given a wallet balance.
 *  Floored — partial reservations don't count. Negative balances
 *  return 0. */
export function leadsReservableFromBalance(balance, avgReservation) {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  if (!Number.isFinite(avgReservation) || avgReservation <= 0) return 0;
  return Math.floor(balance / avgReservation);
}

/** Forward (fund) runway preview: how many leads the company can
 *  reserve AFTER adding `depositAmount` to their available balance.
 *  Used on /escrow/fund as the user types into the amount input. */
export function leadsAfterDeposit({ available, depositAmount, avgReservation }) {
  const next = (available ?? 0) + (Number(depositAmount) || 0);
  return leadsReservableFromBalance(next, avgReservation);
}

/** Reverse (withdraw) runway preview: how many leads the company can
 *  reserve AFTER subtracting `withdrawAmount` from their available
 *  balance. Used on /escrow/withdraw — same mechanic, opposite sign,
 *  no extra adjective-driven push needed. */
export function leadsAfterWithdrawal({ available, withdrawAmount, avgReservation }) {
  const next = (available ?? 0) - (Number(withdrawAmount) || 0);
  return leadsReservableFromBalance(next, avgReservation);
}

/** Computes the median total_reservation across a set of recent leads.
 *  Returns null when there's no data — caller falls back to
 *  DEFAULT_AVG_RESERVATION_DZD. Median (not mean) so a few outlier
 *  enterprise reservations don't skew the runway estimate. */
export function medianReservation(leads = []) {
  const values = leads
    .map((l) => Number(l.total_reservation))
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (values.length === 0) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0
    ? Math.round((values[mid - 1] + values[mid]) / 2)
    : values[mid];
}
