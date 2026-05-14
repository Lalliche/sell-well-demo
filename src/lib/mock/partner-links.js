/**
 * Mock partner-links layer. Reads from MOCK_PARTNER_LINKS +
 * MOCK_PARTNER_LINK_SALES + MOCK_CAMPAIGNS + MOCK_APPLICATIONS.
 *
 * Filter contracts:
 *   fetchPartnerLinks   — partner-side enriched index for /partner-links
 *     - userId   (number, required as session stand-in)
 *     - search   (string) — case-insensitive match on campaign.product_name
 *                            OR company.company_name
 *
 *   fetchPartnerLinkSales — flat sales list, used by the detail overlay
 *     - userId    (number) → sales attributed to links owned by this partner
 *     - linkId    (number) → only sales for this partner_link
 *     - sinceISO  (string) → only sales with created_at >= this ISO timestamp
 *     - untilISO  (string) → only sales with created_at <= this ISO timestamp
 *
 *   fetchEligibleCampaignsForLinks — campaigns the partner CAN generate a
 *   link for: approved CampaignApplication + active campaign +
 *   `partner_links_enabled` + no existing link yet (one-link-per-pair rule).
 *     - userId   (number, required)
 *
 *   generatePartnerLink({ campaign_id, partner_id }) — creates a new link
 *   with one-per-(partner, campaign) guard. Throws `link_already_exists`
 *   when violated, `partner_links_disabled` if the campaign has them off,
 *   `not_approved` if the partner doesn't hold an approved application.
 */

import {
  MOCK_PARTNER_LINKS,
  MOCK_PARTNER_LINK_SALES,
} from "./_seed/partner-links";
import { MOCK_CAMPAIGNS } from "./_seed/campaigns";
import { MOCK_APPLICATIONS } from "./_seed/applications";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";
import { getPlatformSetting } from "./admin";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let _links = MOCK_PARTNER_LINKS.map((l) => ({ ...l }));
let _sales = MOCK_PARTNER_LINK_SALES.map((s) => ({ ...s }));

/** User.id → SalesPartnerProfile.id pass-through for the mock seed.
 *  Real backend will join through `sales_partner_profile.user_id`. */
function partnerIdForUser(userId) {
  return userId;
}

/** Generate the 30-day click bucket array used by index-row sparklines.
 *  We don't seed a full PartnerLinkClick table (the partner doesn't see
 *  individual clicks anyway); instead we synthesize a deterministic daily
 *  bucket from the link's `total_clicks` + a stable shape function so the
 *  same link renders the same trend on every page load.
 *
 *  Shape: gentle right-skewed ramp matching the seed narrative
 *  (partner ramping up activity in recent weeks). Values sum to ~total_clicks
 *  but each day has small wobble so the sparkline doesn't look mechanical.
 */
function buildClickBuckets(linkId, totalClicks) {
  const days = 30;
  const buckets = new Array(days).fill(0);
  // Deterministic pseudo-noise per (linkId, dayIndex) — same input → same output.
  const seeded = (i) => {
    const x = Math.sin((linkId + 1) * 13.37 + i * 7.91) * 10000;
    return x - Math.floor(x); // 0..1
  };
  // Right-skewed weight: day 0 (oldest) ~0.5×, day 29 (today) ~1.5×.
  let weightSum = 0;
  const weights = new Array(days);
  for (let i = 0; i < days; i++) {
    const ramp = 0.5 + (i / (days - 1)) * 1.0;
    const noise = 0.6 + seeded(i) * 0.8;
    weights[i] = ramp * noise;
    weightSum += weights[i];
  }
  for (let i = 0; i < days; i++) {
    buckets[i] = Math.round((weights[i] / weightSum) * totalClicks);
  }
  return buckets;
}

// fetchPartnerLinks() → GET /api/partner-links/
//
// Wire shape per row (PartnerLink fields preserved as-is, plus):
//   campaign:   { id, slug, product_name, status, commission_type,
//                 commission_value, tracking_window_days,
//                 partner_links_enabled,
//                 company: { id, company_name, logo, industry } }
//   conversion_rate: number  — total_conversions / total_clicks, %, 1 decimal
//   click_buckets:  number[] — 30-day daily click counts (oldest → newest)
export async function fetchPartnerLinks(filters = {}) {
  await sleep(280);
  const { userId, search } = filters;
  if (typeof userId !== "number") return [];

  const partnerId = partnerIdForUser(userId);
  let rows = _links.filter((l) => l.sales_partner === partnerId);

  // Live platform settings — admin edits propagate to every partner-link
  // row's attribution+dedup tooltips. Phase 8 backend will consume these
  // same keys server-side when recording PartnerLinkClick rows.
  const attributionWindowDays = getPlatformSetting(
    "partner_link_attribution_window_days",
    90,
  );
  const clickDedupMinutes = getPlatformSetting(
    "click_dedup_window_minutes",
    30,
  );

  const enriched = rows
    .map((l) => {
      const campaign = MOCK_CAMPAIGNS.find((c) => c.id === l.campaign);
      if (!campaign) return null;
      const company = MOCK_COMPANY_PROFILES.find((co) => co.id === campaign.company);
      return {
        ...l,
        attribution_window_days: attributionWindowDays,
        click_dedup_window_minutes: clickDedupMinutes,
        campaign: {
          id: campaign.id,
          slug: campaign.slug,
          product_name: campaign.product_name,
          status: campaign.status,
          commission_type: campaign.commission_type,
          commission_value: campaign.commission_value,
          tracking_window_days: campaign.tracking_window_days,
          partner_links_enabled: campaign.partner_links_enabled,
          company: company
            ? {
                id: company.id,
                company_name: company.company_name,
                logo: company.logo,
                industry: company.industry,
              }
            : null,
        },
        conversion_rate:
          l.total_clicks > 0
            ? Math.round((l.total_conversions / l.total_clicks) * 1000) / 10
            : 0,
        click_buckets: buildClickBuckets(l.id, l.total_clicks),
      };
    })
    .filter(Boolean);

  let filtered = enriched;
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = enriched.filter((row) => {
      const product = (row.campaign.product_name ?? "").toLowerCase();
      const company = (row.campaign.company?.company_name ?? "").toLowerCase();
      return product.includes(q) || company.includes(q);
    });
  }

  // Newest first.
  filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return filtered;
}

// fetchPartnerLinkSales() → GET /api/partner-link-sales/
export async function fetchPartnerLinkSales(filters = {}) {
  await sleep(220);
  let rows = _sales;

  if (typeof filters.userId === "number") {
    const partnerId = partnerIdForUser(filters.userId);
    const linkIds = new Set(
      _links.filter((l) => l.sales_partner === partnerId).map((l) => l.id),
    );
    rows = rows.filter((s) => linkIds.has(s.partner_link));
  }
  if (typeof filters.linkId === "number") {
    rows = rows.filter((s) => s.partner_link === filters.linkId);
  }
  if (filters.sinceISO) {
    const since = new Date(filters.sinceISO).getTime();
    rows = rows.filter((s) => new Date(s.created_at).getTime() >= since);
  }
  if (filters.untilISO) {
    const until = new Date(filters.untilISO).getTime();
    rows = rows.filter((s) => new Date(s.created_at).getTime() <= until);
  }
  return [...rows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

// fetchEligibleCampaignsForLinks() → GET /api/partner-links/eligible-campaigns/
//
// Returns the campaigns the partner CAN generate a link for right now:
//   - partner has an `approved` CampaignApplication
//   - campaign.status === 'active' (paused/draft/closed not eligible)
//   - campaign.partner_links_enabled === true
//   - no PartnerLink already exists for this (partner, campaign) pair
//
// Returned shape mirrors the slice fetchPartnerLinks emits on the
// `campaign` field — same columns the table renders.
export async function fetchEligibleCampaignsForLinks({ userId } = {}) {
  await sleep(240);
  if (typeof userId !== "number") return [];
  const partnerId = partnerIdForUser(userId);

  const approvedCampaignIds = new Set(
    MOCK_APPLICATIONS
      .filter((a) => a.sales_partner === partnerId && a.status === "approved")
      .map((a) => a.campaign),
  );
  const linkedCampaignIds = new Set(
    _links.filter((l) => l.sales_partner === partnerId).map((l) => l.campaign),
  );

  const rows = MOCK_CAMPAIGNS
    .filter(
      (c) =>
        approvedCampaignIds.has(c.id) &&
        c.status === "active" &&
        c.partner_links_enabled === true &&
        !linkedCampaignIds.has(c.id),
    )
    .map((c) => {
      const company = MOCK_COMPANY_PROFILES.find((co) => co.id === c.company);
      return {
        id: c.id,
        slug: c.slug,
        product_name: c.product_name,
        status: c.status,
        commission_type: c.commission_type,
        commission_value: c.commission_value,
        tracking_window_days: c.tracking_window_days,
        partner_links_enabled: c.partner_links_enabled,
        company: company
          ? {
              id: company.id,
              company_name: company.company_name,
              logo: company.logo,
              industry: company.industry,
            }
          : null,
      };
    });
  return rows;
}

// generatePartnerLink() → POST /api/partner-links/
//
// Creates a single PartnerLink for the (partner, campaign) pair. The
// one-link-max rule is enforced here — repeat calls throw.
export async function generatePartnerLink({ campaign_id, partner_id }) {
  await sleep(380);
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaign_id);
  if (!campaign) {
    const err = new Error("campaign_not_found");
    err.code = "campaign_not_found";
    throw err;
  }
  if (!campaign.partner_links_enabled) {
    const err = new Error("partner_links_disabled");
    err.code = "partner_links_disabled";
    throw err;
  }
  const partnerId = partnerIdForUser(partner_id);
  const hasApproved = MOCK_APPLICATIONS.some(
    (a) =>
      a.sales_partner === partnerId &&
      a.campaign === campaign_id &&
      a.status === "approved",
  );
  if (!hasApproved) {
    const err = new Error("not_approved");
    err.code = "not_approved";
    throw err;
  }
  const existing = _links.find(
    (l) => l.sales_partner === partnerId && l.campaign === campaign_id,
  );
  if (existing) {
    const err = new Error("link_already_exists");
    err.code = "link_already_exists";
    throw err;
  }

  // Code shape: `{slug-prefix}-{base36-suffix}`. Stable, copyable.
  const slugPrefix = (campaign.slug ?? "").slice(0, 3) || "lnk";
  const suffix = Math.random().toString(36).slice(2, 8);
  const code = `${slugPrefix}-${suffix}`;
  const nextId = _links.reduce((m, l) => Math.max(m, l.id), 0) + 1;
  const row = {
    id: nextId,
    campaign: campaign_id,
    sales_partner: partnerId,
    code,
    url: `sellwell.dz/r/${code}`,
    total_clicks: 0,
    total_conversions: 0,
    created_at: new Date().toISOString(),
  };
  MOCK_PARTNER_LINKS.push(row);
  _links.push(row);
  return row;
}

// fetchPartnerLinkStats() → GET /api/partner-links/:id/stats/
export async function fetchPartnerLinkStats(id) {
  await sleep(220);
  void id;
  return null;
}

// fetchPartnerLinkPerformance() → GET /api/partner-links/performance/
export async function fetchPartnerLinkPerformance(filters = {}) {
  await sleep(280);
  void filters;
  return [];
}

// initiateCheckout() → POST /api/checkouts/
export async function initiateCheckout({ tier_id, partner_code }) {
  await sleep(500);
  void tier_id;
  void partner_code;
  return null;
}
