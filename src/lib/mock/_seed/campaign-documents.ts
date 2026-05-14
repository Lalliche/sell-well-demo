import type { CampaignDocument } from "@/types/campaign";

/**
 * Mock CampaignDocument seed.
 *
 * Realistic Sales Kit attached to a subset of campaigns so the partner-side
 * "Sales Kit" section on /marketplace/[slug] has visible documents on the
 * dashboard test user's reachable campaigns. Other campaigns intentionally
 * have no documents so the empty-state UX gets exercised too.
 *
 * Coverage:
 *   - Campaign 1 (Atlas CRM)              — full kit: deck + one-pager + pricing + demo video + 2 case studies in 'other'
 *   - Campaign 2 (Sahara Stack K8s)       — partial kit: deck + one-pager only (typical mid-effort merchant)
 *   - Campaign 3 (Maghreb HR Payroll)     — pricing sheet only (a B2B product where the price grid is the pitch)
 *   - Campaign 4 (Atlas Enterprise)       — deck + demo video (enterprise-sale heavy)
 *   - Campaigns 5-9                       — no documents (empty-state coverage)
 *
 * File URLs point at placehold.co PDFs and Loom/YouTube test URLs — swap
 * for real assets when companies upload them post-MVP.
 */
export const MOCK_CAMPAIGN_DOCUMENTS: CampaignDocument[] = [
  /* ── Campaign 1: Atlas CRM — full kit ───────────────────────────────── */
  {
    id: 1,
    campaign: 1,
    slot: "pitch_deck",
    // Real public PDF (Mozilla's pdf.js test fixture — TraceMonkey paper)
    // so the Preview iframe + Download both work end-to-end during the
    // mock pass. Swap for a real Atlas CRM deck when one exists.
    file: "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf",
    url: null,
    label: "Pitch Deck",
    sort_order: 0,
    created_at: "2026-04-12T09:00:00Z",
    updated_at: "2026-04-22T09:00:00Z",
  },
  {
    id: 2,
    campaign: 1,
    slot: "one_pager",
    file: "https://placehold.co/file/atlas-crm-one-pager.pdf",
    url: null,
    label: "Product One-Pager",
    sort_order: 0,
    created_at: "2026-04-12T09:00:00Z",
    updated_at: "2026-04-12T09:00:00Z",
  },
  {
    id: 3,
    campaign: 1,
    slot: "pricing_sheet",
    file: "https://placehold.co/file/atlas-crm-pricing-grid.pdf",
    url: null,
    label: "Pricing Sheet",
    sort_order: 0,
    created_at: "2026-04-15T11:00:00Z",
    updated_at: "2026-05-02T14:00:00Z",
  },
  {
    id: 4,
    campaign: 1,
    slot: "demo_video_url",
    file: null,
    url: "https://www.loom.com/share/atlas-crm-demo",
    label: "Demo Video",
    sort_order: 0,
    created_at: "2026-04-18T10:00:00Z",
    updated_at: "2026-04-18T10:00:00Z",
  },
  {
    id: 5,
    campaign: 1,
    slot: "other",
    file: "https://placehold.co/file/atlas-case-study-touati.pdf",
    url: null,
    label: "Case Study — Touati Imports (3-month rollout)",
    sort_order: 1,
    created_at: "2026-04-25T13:00:00Z",
    updated_at: "2026-04-25T13:00:00Z",
  },
  {
    id: 6,
    campaign: 1,
    slot: "other",
    file: "https://placehold.co/file/atlas-objection-handling.pdf",
    url: null,
    label: "Objection Handling Cheat Sheet",
    sort_order: 2,
    created_at: "2026-05-03T10:00:00Z",
    updated_at: "2026-05-03T10:00:00Z",
  },

  /* ── Campaign 2: Sahara Stack K8s — partial kit ─────────────────────── */
  {
    id: 7,
    campaign: 2,
    slot: "pitch_deck",
    file: "https://placehold.co/file/sahara-stack-pitch.pdf",
    url: null,
    label: "Pitch Deck",
    sort_order: 0,
    created_at: "2026-04-14T08:30:00Z",
    updated_at: "2026-04-14T08:30:00Z",
  },
  {
    id: 8,
    campaign: 2,
    slot: "one_pager",
    file: "https://placehold.co/file/sahara-stack-one-pager.pdf",
    url: null,
    label: "Product One-Pager",
    sort_order: 0,
    created_at: "2026-04-14T08:30:00Z",
    updated_at: "2026-04-26T15:00:00Z",
  },

  /* ── Campaign 3: Maghreb HR Payroll — pricing sheet only ────────────── */
  {
    id: 9,
    campaign: 3,
    slot: "pricing_sheet",
    file: "https://placehold.co/file/maghreb-hr-pricing-tiers.pdf",
    url: null,
    label: "Pricing Sheet",
    sort_order: 0,
    created_at: "2026-04-09T11:00:00Z",
    updated_at: "2026-04-30T09:00:00Z",
  },

  /* ── Campaign 4: Atlas Enterprise — deck + video ────────────────────── */
  {
    id: 10,
    campaign: 4,
    slot: "pitch_deck",
    file: "https://placehold.co/file/atlas-enterprise-pitch.pdf",
    url: null,
    label: "Pitch Deck",
    sort_order: 0,
    created_at: "2026-03-30T14:00:00Z",
    updated_at: "2026-04-20T10:00:00Z",
  },
  {
    id: 11,
    campaign: 4,
    slot: "demo_video_url",
    file: null,
    url: "https://www.youtube.com/watch?v=atlas-enterprise-demo",
    label: "Demo Video",
    sort_order: 0,
    created_at: "2026-04-02T09:00:00Z",
    updated_at: "2026-04-02T09:00:00Z",
  },
];
