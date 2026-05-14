import type { PartnerLink, PartnerLinkSale } from "@/types/partner-link";

/**
 * Mock PartnerLink + PartnerLinkSale seed.
 *
 * 3 partner links owned by partner id 1, one per (partner, campaign) pair.
 * Each campaign here MUST have `partner_links_enabled === true` AND the
 * partner MUST hold an `approved` CampaignApplication on it (data-model-spec.md
 * → PartnerLink). Verified after the 2026-05-09 seed-integrity audit:
 *   - Link 1 → campaign 1 (Atlas CRM, partner_links_enabled, app 1 approved)
 *   - Link 2 → campaign 2 (Sahara Kubernetes, partner_links_enabled, app 2 approved)
 *   - Link 3 → campaign 8 (Sahara Object Storage, partner_links_enabled, app 8 approved)
 *
 * SellWell never hosts the product page or runs checkout — every Partner
 * Link is a click-recording redirect (`sellwell.dz/r/[code]`) that 302s
 * to the merchant's URL with a `?sw_click=<external_click_id>` parameter
 * for attribution.
 *
 * Counters are denormalized — `total_clicks` and `total_conversions`
 * reflect the seed-side reality (conversions exactly match the count of
 * MOCK_PARTNER_LINK_SALES rows pointing at each link, no drift).
 *
 * 21 PartnerLinkSale rows spread across the last 90 days so the hero
 * commission area chart has shape when we build it. Distribution is
 * weighted: more sales in recent weeks (mimicking the partner ramping up).
 *
 * `chargily_payment_id` is a unique fake string per row, satisfying the
 * idempotency guard documented in the type.
 *
 * `external_click_id` is set on every row — it's the foreign key (by
 * value) to PartnerLinkClick.external_click_id, identifying which click
 * produced the sale. The mock doesn't ship a PartnerLinkClick seed yet
 * (clicks are server-recorded; the partner doesn't see them as rows),
 * but the contract is locked.
 */

export const MOCK_PARTNER_LINKS: PartnerLink[] = [
  {
    id: 1,
    campaign: 1,                             // Atlas CRM (10% pct)
    sales_partner: 1,
    code: "atl-a7x9k2",
    url: "sellwell.dz/r/atl-a7x9k2",
    total_clicks: 412,
    total_conversions: 14,                   // matches sales rows below
    created_at: "2026-04-17T10:00:00Z",
  },
  {
    id: 2,
    campaign: 2,                             // Sahara Kubernetes (8% pct)
    sales_partner: 1,
    code: "sah-b8y2n4",
    url: "sellwell.dz/r/sah-b8y2n4",
    total_clicks: 187,
    total_conversions: 5,                    // matches sales rows below
    created_at: "2026-04-21T15:00:00Z",
  },
  {
    id: 3,
    campaign: 8,                             // Sahara Object Storage (flat 8,000 DA)
    sales_partner: 1,
    code: "sos-c1z5m7",
    url: "sellwell.dz/r/sos-c1z5m7",
    total_clicks: 64,
    total_conversions: 2,                    // matches sales rows below
    created_at: "2026-05-06T15:00:00Z",
  },
];

/* Hero chart needs 90 days of sales spread across the partner's links. We
 * generate 21 PartnerLinkSale rows hand-tuned for shape: a quiet first
 * month, ramp-up in weeks 2-3, peak in the last 14 days.
 *
 * Per-link breakdown (matches denormalized counters above):
 *   Link 1 (Atlas CRM, 10% pct):                    14 sales
 *   Link 2 (Sahara Kubernetes, 8% pct):             5 sales
 *   Link 3 (Sahara Object Storage, flat 8,000 DA):  2 sales
 *
 * Math sanity (per shared-specs/escrow-leads-spec.md → Reservation Math):
 *   percentage commission: sale_amount × pct
 *   flat commission:       fixed value regardless of sale_amount
 *   platform_fee:          sale_amount × 10% (default platform_fee_percentage)
 */
export const MOCK_PARTNER_LINK_SALES: PartnerLinkSale[] = [
  // ── Older sales (60-90 days back) — quiet ramp ──────────────────────
  { id: 3,  partner_link: 1, pricing_tier: null, external_click_id: "clk_s003", sale_amount: 8000,  commission_amount: 800,   platform_fee_amount: 800,   chargily_payment_id: "chg_003", created_at: "2026-02-25T11:30:00Z" },

  // ── Mid-window (30-60 days back) — ramp ─────────────────────────────
  { id: 5,  partner_link: 1, pricing_tier: null, external_click_id: "clk_s005", sale_amount: 8000,  commission_amount: 800,   platform_fee_amount: 800,   chargily_payment_id: "chg_005", created_at: "2026-03-12T15:30:00Z" },
  { id: 6,  partner_link: 1, pricing_tier: null, external_click_id: "clk_s006", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_006", created_at: "2026-03-18T11:00:00Z" },
  { id: 8,  partner_link: 1, pricing_tier: null, external_click_id: "clk_s008", sale_amount: 8000,  commission_amount: 800,   platform_fee_amount: 800,   chargily_payment_id: "chg_008", created_at: "2026-03-28T10:00:00Z" },
  { id: 9,  partner_link: 2, pricing_tier: null, external_click_id: "clk_s009", sale_amount: 12000, commission_amount: 960,   platform_fee_amount: 1200,  chargily_payment_id: "chg_009", created_at: "2026-04-02T08:00:00Z" },

  // ── Recent (last 30 days) — peak activity ───────────────────────────
  { id: 10, partner_link: 1, pricing_tier: null, external_click_id: "clk_s010", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_010", created_at: "2026-04-12T14:00:00Z" },
  { id: 11, partner_link: 1, pricing_tier: null, external_click_id: "clk_s011", sale_amount: 8000,  commission_amount: 800,   platform_fee_amount: 800,   chargily_payment_id: "chg_011", created_at: "2026-04-15T16:00:00Z" },
  { id: 12, partner_link: 2, pricing_tier: null, external_click_id: "clk_s012", sale_amount: 12000, commission_amount: 960,   platform_fee_amount: 1200,  chargily_payment_id: "chg_012", created_at: "2026-04-18T09:30:00Z" },
  { id: 13, partner_link: 1, pricing_tier: null, external_click_id: "clk_s013", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_013", created_at: "2026-04-20T11:00:00Z" },
  { id: 14, partner_link: 1, pricing_tier: null, external_click_id: "clk_s014", sale_amount: 45000, commission_amount: 4500,  platform_fee_amount: 4500,  chargily_payment_id: "chg_014", created_at: "2026-04-22T13:00:00Z" },
  { id: 15, partner_link: 2, pricing_tier: null, external_click_id: "clk_s015", sale_amount: 38000, commission_amount: 3040,  platform_fee_amount: 3800,  chargily_payment_id: "chg_015", created_at: "2026-04-25T15:30:00Z" },
  { id: 16, partner_link: 1, pricing_tier: null, external_click_id: "clk_s016", sale_amount: 8000,  commission_amount: 800,   platform_fee_amount: 800,   chargily_payment_id: "chg_016", created_at: "2026-04-27T10:00:00Z" },
  { id: 17, partner_link: 1, pricing_tier: null, external_click_id: "clk_s017", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_017", created_at: "2026-04-29T14:30:00Z" },
  { id: 18, partner_link: 2, pricing_tier: null, external_click_id: "clk_s018", sale_amount: 12000, commission_amount: 960,   platform_fee_amount: 1200,  chargily_payment_id: "chg_018", created_at: "2026-05-01T09:00:00Z" },

  // ── Last 7 days — daily activity ────────────────────────────────────
  { id: 19, partner_link: 1, pricing_tier: null, external_click_id: "clk_s019", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_019", created_at: "2026-05-03T12:00:00Z" },
  // First Sahara Object Storage sale on the brand-new link 3 (campaign 8,
  // single tier "Standard" 6,000 DA, flat 8,000 DA commission per sale).
  { id: 20, partner_link: 3, pricing_tier: null, external_click_id: "clk_s020", sale_amount: 6000,  commission_amount: 8000,  platform_fee_amount: 600,   chargily_payment_id: "chg_020", created_at: "2026-05-07T10:00:00Z" },
  { id: 21, partner_link: 1, pricing_tier: null, external_click_id: "clk_s021", sale_amount: 8000,  commission_amount: 800,   platform_fee_amount: 800,   chargily_payment_id: "chg_021", created_at: "2026-05-05T14:00:00Z" },
  { id: 22, partner_link: 2, pricing_tier: null, external_click_id: "clk_s022", sale_amount: 12000, commission_amount: 960,   platform_fee_amount: 1200,  chargily_payment_id: "chg_022", created_at: "2026-05-06T16:30:00Z" },
  { id: 23, partner_link: 1, pricing_tier: null, external_click_id: "clk_s023", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_023", created_at: "2026-05-07T11:00:00Z" },
  { id: 24, partner_link: 1, pricing_tier: null, external_click_id: "clk_s024", sale_amount: 18000, commission_amount: 1800,  platform_fee_amount: 1800,  chargily_payment_id: "chg_024", created_at: "2026-05-08T13:30:00Z" },
  // Second Sahara Object Storage sale.
  { id: 25, partner_link: 3, pricing_tier: null, external_click_id: "clk_s025", sale_amount: 6000,  commission_amount: 8000,  platform_fee_amount: 600,   chargily_payment_id: "chg_025", created_at: "2026-05-09T08:00:00Z" },
];
