/**
 * Tab classifier for /leads. Maps the 9-status Lead enum into 5
 * partner-meaningful tab buckets. Pure — `now` is passed in so callers
 * can keep render functions clean of impure reads (React 19 rule).
 */

export const EXPIRING_SOON_MS = 48 * 60 * 60 * 1000;

export function classifyTab(row, now) {
  const { status, tracking_window_expires_at } = row;
  if (status === "draft") return "draft";
  if (status === "acknowledged") {
    const remaining = tracking_window_expires_at
      ? new Date(tracking_window_expires_at).getTime() - now
      : null;
    if (remaining !== null && remaining <= EXPIRING_SOON_MS) return "expiringSoon";
    return "active";
  }
  if (
    status === "submitted" ||
    status === "pending_escrow" ||
    status === "disputed_verifying" ||
    status === "expired_verifying"
  ) {
    return "awaiting";
  }
  return "closed";
}
