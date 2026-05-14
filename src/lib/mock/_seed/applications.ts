import type { CampaignApplication } from "@/types/campaign";

/**
 * Mock CampaignApplication seed.
 *
 * Partner id 1 (`partner@sellwell.dz`) covers all three application
 * statuses so /applications has a realistic mix to exercise tabs:
 *   - 5 approved (Atlas CRM, Sahara Kubernetes, Maghreb HR, Atlas Enterprise,
 *                 Sahara Object Storage)
 *   - 1 pending (Maghreb Recruitment ATS)
 *   - 1 rejected (Sahara CDN — paused campaign, applied + rejected before pause)
 *
 * Other partners (2, 3, 4) have a few applications too so the dashboards
 * for company users (Phase 7) have something to render.
 */
export const MOCK_APPLICATIONS: CampaignApplication[] = [
  // ── Partner 1 (the dashboard test user) ─────────────────────────────
  {
    id: 1,
    campaign: 1,
    sales_partner: 1,
    pitch:
      "I've been selling B2B SaaS in Algeria for 6 years, mostly to SMBs in retail and services. Atlas CRM fits the pitch I'm already making — replacing spreadsheets with something local and Arabic-first.",
    status: "approved",
    applied_at: "2026-04-16T10:00:00Z",
    reviewed_at: "2026-04-17T14:00:00Z",
  },
  {
    id: 2,
    campaign: 2,
    sales_partner: 1,
    pitch:
      "Strong technical comfort — I sold Odoo and HubSpot for 4 years. Saharan Stack's local data residency story is an easy pitch to fintechs and regulated industries that aren't comfortable on AWS.",
    status: "approved",
    applied_at: "2026-04-19T09:30:00Z",
    reviewed_at: "2026-04-21T11:00:00Z",
  },
  {
    id: 3,
    campaign: 3,
    sales_partner: 1,
    pitch:
      "Payroll is my best entry conversation with Algerian SMBs. I have an existing relationship with ~30 accounting firms who can refer clients.",
    status: "approved",
    applied_at: "2026-04-22T11:00:00Z",
    reviewed_at: "2026-04-24T09:00:00Z",
  },
  {
    id: 4,
    campaign: 4,
    sales_partner: 1,
    pitch:
      "Enterprise sales is where I want to grow. I have warm intros into 3 large Algerian groups that are evaluating CRM consolidation.",
    status: "approved",
    applied_at: "2026-04-26T15:00:00Z",
    reviewed_at: "2026-04-29T10:00:00Z",
  },
  {
    id: 5,
    campaign: 5,                             // Sahara CDN — partner was rejected
    sales_partner: 1,
    pitch: "Edge CDN is an easier upsell to my Atlas CRM customers.",
    status: "rejected",
    applied_at: "2026-04-26T13:00:00Z",
    reviewed_at: "2026-04-29T16:00:00Z",
  },
  {
    id: 8,
    campaign: 8,                             // Sahara Object Storage — approved (Partner Links enabled)
    sales_partner: 1,
    pitch:
      "Object storage is the easiest sell to teams I'm already pitching Kubernetes to. I can bundle both as a single migration story for the 3 Algiers fintechs in my pipeline.",
    status: "approved",
    applied_at: "2026-05-04T09:30:00Z",
    reviewed_at: "2026-05-06T14:00:00Z",
  },
  {
    id: 9,
    campaign: 9,                             // Maghreb Recruitment ATS — pending review (newest)
    sales_partner: 1,
    pitch:
      "Recruitment ATS rounds out the Maghreb HR pitch I'm already running with accounting firms. Many of them have hiring pain and would consider an upsell on the same vendor.",
    status: "pending",
    applied_at: "2026-05-07T14:00:00Z",
    reviewed_at: null,
  },

  // ── Partner 2 ───────────────────────────────────────────────────────
  {
    id: 6,
    campaign: 1,
    sales_partner: 2,
    pitch: "Mostly inbound CRM sales experience. Pitch is straightforward.",
    status: "approved",
    applied_at: "2026-04-20T10:00:00Z",
    reviewed_at: "2026-04-22T16:00:00Z",
  },
  {
    id: 7,
    campaign: 3,
    sales_partner: 2,
    pitch: "I have 3 SME clients ready to switch payroll providers.",
    status: "pending",
    applied_at: "2026-05-05T10:00:00Z",
    reviewed_at: null,
  },

  // ── Partner 3 (Karim Boudiaf) ───────────────────────────────────────
  // Pending application on Atlas CRM so the company-side /applications
  // page has a real pending row to exercise the Approve / Reject flow
  // end-to-end. Karim's cybersecurity-adjacent background gives the
  // company a non-obvious decision (his pitch leans on a technical
  // angle for Atlas, which is more of an SMB CRM than enterprise).
  {
    id: 10,
    campaign: 1,                             // Atlas CRM
    sales_partner: 3,
    pitch:
      "I'm coming at this from the cloud-infra side of the market. My pitch for Atlas would lean on the Algerian-data-residency story — a real concern for the regulated SMBs I'm already in conversations with (insurance brokers, accounting firms). I've onboarded ~12 customers to Odoo over the past 18 months, so the CRM motion is familiar.",
    status: "pending",
    applied_at: "2026-05-09T10:30:00Z",
    reviewed_at: null,
  },
];
