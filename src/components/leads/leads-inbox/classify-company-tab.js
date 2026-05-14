/**
 * Tab classifier for the company-side /leads inbox.
 *
 * Maps the 9-status Lead enum into 5 company-meaningful tab buckets that
 * mirror the dashboard's `LeadsInboxPreview` chips:
 *   awaitingReserve   — submitted | pending_escrow (need Reserve & View)
 *   inWindow          — acknowledged with tracking_window > 14 days left
 *   awaitingConfirm   — acknowledged with ≤ 14 days left (deal needs to close)
 *   disputed          — disputed_verifying | expired_verifying
 *   closed            — converted | converted_verified | not_converted | expired
 *
 * Pure — `now` passed in by the caller so derivations stay clean of
 * impure Date.now() reads inside render (React 19 rule).
 */

const AWAITING_CONFIRM_MS = 14 * 86_400_000;

export function classifyCompanyTab(row, now) {
  const { status, tracking_window_expires_at } = row;

  if (status === "submitted" || status === "pending_escrow") {
    return "awaitingReserve";
  }
  if (status === "acknowledged") {
    const remaining = tracking_window_expires_at
      ? new Date(tracking_window_expires_at).getTime() - now
      : null;
    if (remaining !== null && remaining <= AWAITING_CONFIRM_MS) {
      return "awaitingConfirm";
    }
    return "inWindow";
  }
  if (status === "disputed_verifying" || status === "expired_verifying") {
    return "disputed";
  }
  return "closed";
}
