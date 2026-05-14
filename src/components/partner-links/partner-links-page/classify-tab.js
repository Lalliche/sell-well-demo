/**
 * Tab classifier for /partner-links. Maps a PartnerLink (already enriched
 * with `campaign.status` and `total_clicks`) into one of three
 * partner-meaningful tab buckets:
 *
 *   "active"     — campaign is active AND link has at least one click.
 *                  These are the links earning the partner real attribution.
 *   "noActivity" — campaign is active but the link has zero clicks.
 *                  Just-generated, or a link nobody's clicking yet.
 *   "paused"     — campaign is paused / draft / closed. Existing clicks
 *                  + sales remain visible (historical), but no new
 *                  attribution is happening.
 *
 * Pure — no time / Date.now() involved (unlike /leads' classifier),
 * so callers don't need the `now` capture pattern.
 */

export function classifyTab(row) {
  const status = row?.campaign?.status;
  if (status !== "active") return "paused";
  return (row.total_clicks ?? 0) > 0 ? "active" : "noActivity";
}
