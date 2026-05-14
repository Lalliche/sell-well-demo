import type { Lead, LeadNote, LeadDocument } from "@/types/lead";

/**
 * Mock Lead seed.
 *
 * 14 leads owned by partner id 1 (the dashboard test user). Designed to
 * populate every status filter chip on the dashboard's recent-leads table:
 *   - 2 draft (private to partner, pre-submission)
 *   - 1 submitted (awaiting company acknowledgment)
 *   - 1 pending_escrow (company low on escrow)
 *   - 3 acknowledged (in tracking window) — 1 EXPIRING <48h, others further out
 *   - 3 converted (commission released this month)
 *   - 1 converted_verified (client confirmed after company denial)
 *   - 1 not_converted (verified — clean miss)
 *   - 1 disputed_verifying (company denied, SellWell verifying)
 *   - 1 expired (no company response within 7d)
 *
 * `today` reference for timing: 2026-05-09 (per session date). All timestamps
 * computed back from there.
 *
 * Per the LeadNote model (data-model-spec.md): per-lead conversation history
 * lives in MOCK_LEAD_NOTES below — append-only rows. The old
 * `Lead.conversation_notes` text field is gone.
 *
 * Commission/platform-fee math follows shared-specs/escrow-leads-spec.md:
 *   percentage commission: tier_price × pct
 *   flat commission: fixed value regardless of tier
 *   platform_fee: tier_price × 10% (default platform_fee_percentage)
 *   total_reservation: commission + platform_fee
 */
export const MOCK_LEADS: Lead[] = [
  /* 0a — draft, recently saved (partner still gathering info) */
  {
    id: 99,
    slug: "samir-bouaziz-d4a",
    campaign: 1,                             // Atlas CRM (10% pct)
    sales_partner: 1,
    pricing_tier: 2,                         // Pro · 18,000 DA
    client_full_name: "Samir Bouaziz",
    client_company_name: "Bouaziz Trading",
    client_phone: "+213 555 90 10 20",
    client_email: "samir@bouaziz-trading.dz",
    status: "draft",
    commission_amount: 1800,
    platform_fee_amount: 1800,
    total_reservation: 3600,
    actual_sale_amount: null,
    acknowledged_at: null,
    tracking_window_expires_at: null,
    submitted_at: null,
    created_at: "2026-05-08T16:45:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 0b — draft, older (partner has been working it for a few days) */
  {
    id: 100,
    slug: "fatima-zerrouki-e7b",
    campaign: 2,                             // Sahara Stack
    sales_partner: 1,
    pricing_tier: 5,                         // Production · 38,000 DA
    client_full_name: "Fatima Zerrouki",
    client_company_name: "Zerrouki Conseil",
    client_phone: "+213 661 70 80 90",
    client_email: null,
    status: "draft",
    commission_amount: 3040,                 // 38,000 × 8%
    platform_fee_amount: 3800,
    total_reservation: 6840,
    actual_sale_amount: null,
    acknowledged_at: null,
    tracking_window_expires_at: null,
    submitted_at: null,
    created_at: "2026-05-04T11:20:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 1 — submitted, awaiting acknowledgment (1 day old) */
  {
    id: 101,
    slug: "mehdi-touati-7k2",
    campaign: 1,                             // Atlas CRM (10% pct)
    sales_partner: 1,
    pricing_tier: 2,                         // Pro · 18,000 DA
    client_full_name: "Mehdi Touati",
    client_company_name: "Touati Imports SARL",
    client_phone: "+213 555 47 89 12",
    client_email: "mehdi@touati-imports.dz",
    status: "submitted",
    commission_amount: 1800,                 // 18,000 × 10%
    platform_fee_amount: 1800,               // 18,000 × 10%
    total_reservation: 3600,
    actual_sale_amount: null,
    acknowledged_at: null,
    tracking_window_expires_at: null,
    submitted_at: "2026-05-08T11:30:00Z",
    created_at: "2026-05-06T09:00:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 2 — pending_escrow (company doesn't have enough balance) */
  {
    id: 102,
    slug: "yacine-khelladi-9p4",
    campaign: 4,                             // Atlas Enterprise (12% pct, big ticket)
    sales_partner: 1,
    pricing_tier: 9,                         // Annual · 180,000 DA
    client_full_name: "Yacine Khelladi",
    client_company_name: "Groupe Khelladi",
    client_phone: "+213 661 23 45 67",
    client_email: "yacine.k@groupe-khelladi.dz",
    status: "pending_escrow",
    commission_amount: 21600,                // 180,000 × 12%
    platform_fee_amount: 18000,              // 180,000 × 10%
    total_reservation: 39600,
    actual_sale_amount: null,
    acknowledged_at: null,
    tracking_window_expires_at: null,
    submitted_at: "2026-05-07T15:00:00Z",
    created_at: "2026-05-05T10:00:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 3 — acknowledged, EXPIRING in <48h (tracking window almost up) */
  {
    id: 103,
    slug: "sofiane-belkacem-3m8",
    campaign: 3,                             // Maghreb HR (5,000 DA flat)
    sales_partner: 1,
    pricing_tier: 7,                         // Standard · 22,000 DA (campaign 3 is single-tier)
    client_full_name: "Sofiane Belkacem",
    client_company_name: "Belkacem Distribution",
    client_phone: "+213 770 11 22 33",
    client_email: "s.belkacem@bk-distrib.dz",
    status: "acknowledged",
    commission_amount: 5000,                 // flat
    platform_fee_amount: 2200,               // 22,000 × 10%
    total_reservation: 7200,
    actual_sale_amount: null,
    acknowledged_at: "2026-03-12T09:00:00Z",
    tracking_window_expires_at: "2026-05-11T09:00:00Z", // ~2 days from 2026-05-09
    submitted_at: "2026-03-11T14:00:00Z",
    created_at: "2026-03-10T10:00:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 4 — acknowledged, healthy tracking window */
  {
    id: 104,
    slug: "lina-hadj-said-2x9",
    campaign: 1,                             // Atlas CRM
    sales_partner: 1,
    pricing_tier: 1,                         // Starter · 8,000 DA
    client_full_name: "Lina Hadj-Saïd",
    client_company_name: "Hadj-Saïd Boutique",
    client_phone: "+213 555 44 55 66",
    client_email: "lina@hadjsaid.dz",
    status: "acknowledged",
    commission_amount: 800,
    platform_fee_amount: 800,
    total_reservation: 1600,
    actual_sale_amount: null,
    acknowledged_at: "2026-04-28T10:00:00Z",
    tracking_window_expires_at: "2026-06-27T10:00:00Z",
    submitted_at: "2026-04-27T16:00:00Z",
    created_at: "2026-04-26T11:00:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 5 — acknowledged, mid-window */
  {
    id: 105,
    slug: "karim-bouzid-6r1",
    campaign: 2,                             // Sahara Stack
    sales_partner: 1,
    pricing_tier: 5,                         // Production · 38,000 DA
    client_full_name: "Karim Bouzid",
    client_company_name: "FastDeliv DZ",
    client_phone: "+213 660 88 77 99",
    client_email: "karim@fastdeliv.dz",
    status: "acknowledged",
    commission_amount: 3040,                 // 38,000 × 8%
    platform_fee_amount: 3800,               // 38,000 × 10%
    total_reservation: 6840,
    actual_sale_amount: null,
    acknowledged_at: "2026-04-15T11:00:00Z",
    tracking_window_expires_at: "2026-07-14T11:00:00Z",
    submitted_at: "2026-04-14T10:30:00Z",
    created_at: "2026-04-12T09:00:00Z",
    resolved_at: null,
    denial_reason: null,
  },

  /* 6 — converted, this month */
  {
    id: 106,
    slug: "karim-benali-4j7",
    campaign: 1,                             // Atlas CRM
    sales_partner: 1,
    pricing_tier: 2,                         // Pro · 18,000 DA
    client_full_name: "Karim Benali",
    client_company_name: "Benali Retail Group",
    client_phone: "+213 555 33 44 55",
    client_email: "k.benali@benali-retail.dz",
    status: "converted",
    commission_amount: 1800,
    platform_fee_amount: 1800,
    total_reservation: 3600,
    actual_sale_amount: 18000,
    acknowledged_at: "2026-05-02T09:00:00Z",
    tracking_window_expires_at: "2026-07-01T09:00:00Z",
    submitted_at: "2026-05-01T11:00:00Z",
    created_at: "2026-04-30T15:00:00Z",
    resolved_at: "2026-05-05T14:00:00Z",
    denial_reason: null,
  },

  /* 7 — converted, this month */
  {
    id: 107,
    slug: "nadia-rahmani-8q3",
    campaign: 3,                             // Maghreb HR (flat 5,000)
    sales_partner: 1,
    pricing_tier: 7,                         // Standard · 22,000 DA
    client_full_name: "Nadia Rahmani",
    client_company_name: "Rahmani Cabinet Comptable",
    client_phone: "+213 555 77 88 99",
    client_email: "nadia@rahmani-cabinet.dz",
    status: "converted",
    commission_amount: 5000,
    platform_fee_amount: 2200,
    total_reservation: 7200,
    actual_sale_amount: 22000,
    acknowledged_at: "2026-04-30T11:00:00Z",
    tracking_window_expires_at: "2026-06-29T11:00:00Z",
    submitted_at: "2026-04-29T15:00:00Z",
    created_at: "2026-04-28T10:00:00Z",
    resolved_at: "2026-05-03T10:00:00Z",
    denial_reason: null,
  },

  /* 8 — converted, last month */
  {
    id: 108,
    slug: "amine-cherif-1v5",
    campaign: 1,                             // Atlas CRM
    sales_partner: 1,
    pricing_tier: 3,                         // Enterprise · 45,000 DA
    client_full_name: "Amine Cherif",
    client_company_name: "Cherif Industries",
    client_phone: "+213 770 55 66 77",
    client_email: "a.cherif@cherif-industries.dz",
    status: "converted",
    commission_amount: 4500,                 // 45,000 × 10%
    platform_fee_amount: 4500,
    total_reservation: 9000,
    actual_sale_amount: 45000,
    acknowledged_at: "2026-04-08T10:00:00Z",
    tracking_window_expires_at: "2026-06-07T10:00:00Z",
    submitted_at: "2026-04-07T12:00:00Z",
    created_at: "2026-04-05T14:00:00Z",
    resolved_at: "2026-04-19T16:00:00Z",
    denial_reason: null,
  },

  /* 9 — converted_verified (company denied, client confirmed) */
  {
    id: 109,
    slug: "walid-saadi-5h0",
    campaign: 3,                             // Maghreb HR
    sales_partner: 1,
    pricing_tier: 7,
    client_full_name: "Walid Saadi",
    client_company_name: "Saadi Logistique",
    client_phone: "+213 661 99 00 11",
    client_email: "walid@saadi-log.dz",
    status: "converted_verified",
    commission_amount: 5000,
    platform_fee_amount: 2200,
    total_reservation: 7200,
    actual_sale_amount: 22000,
    acknowledged_at: "2026-03-25T09:00:00Z",
    tracking_window_expires_at: "2026-05-24T09:00:00Z",
    submitted_at: "2026-03-24T11:00:00Z",
    created_at: "2026-03-22T10:00:00Z",
    resolved_at: "2026-04-30T15:00:00Z",
    denial_reason:
      "Maghreb HR initially marked the lead as not converted, claiming the client never signed. SellWell verification confirmed the sale closed on 2026-04-15 — commission released, company flagged.",
  },

  /* 10 — not_converted (clean miss, verified by client) */
  {
    id: 110,
    slug: "reda-ouali-0e6",
    campaign: 1,
    sales_partner: 1,
    pricing_tier: 2,
    client_full_name: "Reda Ouali",
    client_company_name: "Ouali Tech",
    client_phone: "+213 555 22 33 44",
    client_email: null,
    status: "not_converted",
    commission_amount: 1800,
    platform_fee_amount: 1800,
    total_reservation: 3600,
    actual_sale_amount: null,
    acknowledged_at: "2026-03-15T10:00:00Z",
    tracking_window_expires_at: "2026-05-14T10:00:00Z",
    submitted_at: "2026-03-14T13:00:00Z",
    created_at: "2026-03-13T11:00:00Z",
    resolved_at: "2026-04-25T09:00:00Z",
    denial_reason:
      "Atlas CRM reached the client twice; client said the team was happy with their existing spreadsheet workflow and decided not to migrate this quarter. SellWell verified — no purchase, escrow returned.",
  },

  /* 11 — disputed_verifying (company denied, SellWell investigating) */
  {
    id: 111,
    slug: "hassan-tabet-2c4",
    campaign: 4,                             // Atlas Enterprise
    sales_partner: 1,
    pricing_tier: 9,
    client_full_name: "Hassan Tabet",
    client_company_name: "Tabet Holdings",
    client_phone: "+213 770 12 12 12",
    client_email: "h.tabet@tabet-holdings.dz",
    status: "disputed_verifying",
    commission_amount: 21600,
    platform_fee_amount: 18000,
    total_reservation: 39600,
    actual_sale_amount: null,
    acknowledged_at: "2026-03-20T11:00:00Z",
    tracking_window_expires_at: "2026-06-18T11:00:00Z",
    submitted_at: "2026-03-19T14:00:00Z",
    created_at: "2026-03-17T09:00:00Z",
    resolved_at: null,
    denial_reason: "Company says client never signed. SellWell verifying with client.",
  },

  /* 12 — expired (no company response within 7d) */
  {
    id: 112,
    slug: "imane-djebbar-9b2",
    campaign: 4,                             // Atlas Enterprise (12% pct, partner 1 approved)
    sales_partner: 1,
    pricing_tier: 9,                         // Annual · 180,000 DA
    client_full_name: "Imane Djebbar",
    client_company_name: "Djebbar Studio",
    client_phone: "+213 555 66 77 88",
    client_email: null,
    status: "expired",
    commission_amount: 21600,                // 180,000 × 12%
    platform_fee_amount: 18000,              // 180,000 × 10%
    total_reservation: 39600,
    actual_sale_amount: null,
    acknowledged_at: null,
    tracking_window_expires_at: null,
    submitted_at: "2026-04-01T10:00:00Z",
    created_at: "2026-03-31T15:00:00Z",
    resolved_at: "2026-04-08T10:00:00Z",
    denial_reason: null,
  },

  /* 13 — expired_verifying (tracking window expired without action,
   *      SellWell verifying with client). Populates the "Expired"
   *      tab on /admin/disputes so admin can exercise the same
   *      resolution flow from an aged-out tracking window. */
  {
    id: 113,
    slug: "tarek-bouguerra-4f9",
    campaign: 2,                             // Sahara Stack — Managed Kubernetes (8% pct)
    sales_partner: 2,                        // Yasmine Khelifi
    pricing_tier: 5,                         // Production · 38,000 DA
    client_full_name: "Tarek Bouguerra",
    client_company_name: "Bouguerra Logistics",
    client_phone: "+213 661 44 55 66",
    client_email: "t.bouguerra@bouguerra-logistics.dz",
    status: "expired_verifying",
    commission_amount: 3040,                 // 38,000 × 8%
    platform_fee_amount: 3800,               // 38,000 × 10%
    total_reservation: 6840,
    actual_sale_amount: null,
    acknowledged_at: "2026-02-15T11:00:00Z",
    tracking_window_expires_at: "2026-04-16T11:00:00Z",
    submitted_at: "2026-02-13T09:00:00Z",
    created_at: "2026-02-12T16:00:00Z",
    resolved_at: null,
    denial_reason: null,
  },
];

/**
 * Mock LeadNote seed — append-only conversation history per lead.
 *
 * Replaces the old single `Lead.conversation_notes` text blob. Notes are
 * sorted by `created_at` ascending in the UI (oldest first → newest at
 * the bottom of the timeline, like a chat).
 *
 * Most leads have 1–4 notes; the draft leads also have notes (drafts can
 * accumulate context before submission). Some closed/expired leads have
 * none — that's fine.
 */
export const MOCK_LEAD_NOTES: LeadNote[] = [
  // Lead 99 — draft, partner still discovering
  {
    id: 1001, lead: 99, body:
      "Cold-called Samir at Bouaziz Trading after a LinkedIn intro from Mourad. They're an established import/export shop in Algiers, ~25 staff. He's burned by a failed Zoho rollout two years ago and needs convincing that adoption won't be the same story. Hard sell on training + Arabic-first UI angles.",
    created_at: "2026-05-08T16:50:00Z", author: "partner", },
  {
    id: 1002, lead: 99, body:
      "Sent over the Atlas Pro one-pager + the Hima case study (similar import business). Promised a follow-up call next Monday after he's had time to read.",
    created_at: "2026-05-09T09:15:00Z", author: "partner", },

  // Lead 100 — older draft
  {
    id: 1003, lead: 100, body:
      "Met Fatima at the Algiers tech meetup. Conseil business with 12 consultants, all on individual cloud subscriptions, looking to consolidate. Sahara Stack + the Algiers data center is the angle.",
    created_at: "2026-05-04T11:30:00Z", author: "partner", },
  {
    id: 1004, lead: 100, body:
      "Demo'd the Production tier yesterday over Zoom. Strong reaction to the latency benchmarks. She's pushing internal budget approval — needs a written quote with the annual discount applied.",
    created_at: "2026-05-07T17:40:00Z", author: "partner", },

  // Lead 101 — submitted recently
  {
    id: 1005, lead: 101, body:
      "Mehdi runs a 30-person import/export company in Oran. Currently using Excel + WhatsApp for sales tracking. Demo'd Atlas Pro tier last Tuesday, very interested. Wants pricing finalized this week.",
    created_at: "2026-05-06T09:05:00Z", author: "partner", },
  {
    id: 1006, lead: 101, body:
      "Sent Mehdi the proposal Wed evening. He confirmed receipt and said he'll loop in his ops lead before signing.",
    created_at: "2026-05-07T18:30:00Z", author: "partner", },
  {
    id: 1007, lead: 101, body:
      "Submitted the lead to Atlas. Waiting on acknowledgment.",
    created_at: "2026-05-08T11:32:00Z", author: "partner", },

  // Lead 102 — pending escrow
  {
    id: 1008, lead: 102, body:
      "Mid-size group in Constantine, 250 employees, evaluating Salesforce vs Atlas Enterprise. Procurement-driven — need a written quote next week.",
    created_at: "2026-05-05T10:10:00Z", author: "partner", },
  {
    id: 1009, lead: 102, body:
      "Atlas escrow seems low — saw the pending_escrow flag on the lead. Following up with Atlas via the platform's nudge.",
    created_at: "2026-05-08T12:00:00Z", author: "partner", },

  // Lead 103 — acknowledged, expiring soon
  {
    id: 1010, lead: 103, body:
      "120-person logistics company. Demo went well 60 days ago. Slow procurement; following up weekly.",
    created_at: "2026-03-10T10:15:00Z", author: "partner", },
  {
    id: 1011, lead: 103, body:
      "Sofiane confirmed last week that the contract is moving through legal. Hoping to close before the tracking window expires.",
    created_at: "2026-05-04T14:20:00Z", author: "partner", },

  // Lead 104 — acknowledged, healthy
  {
    id: 1012, lead: 104, body:
      "Small retail boutique, 8 staff. Wants Atlas Starter for customer follow-up. Ready to buy, just waiting on Atlas to send the proposal.",
    created_at: "2026-04-26T11:10:00Z", author: "partner", },

  // Lead 105 — acknowledged, mid-window
  {
    id: 1013, lead: 105, body:
      "Logistics SaaS startup, 25-person team, currently on AWS Frankfurt. Worried about latency to Algerian customers. Sahara's Algiers data center is the pitch.",
    created_at: "2026-04-12T09:10:00Z", author: "partner", },

  // Lead 106 — converted
  {
    id: 1014, lead: 106, body:
      "12-person retail group. Closed quickly after demo.",
    created_at: "2026-04-30T15:05:00Z", author: "partner", },

  // Lead 107 — converted
  {
    id: 1015, lead: 107, body:
      "Accounting firm, 15 staff. Easy sale.",
    created_at: "2026-04-28T10:05:00Z", author: "partner", },

  // Lead 108 — converted
  {
    id: 1016, lead: 108, body: "Manufacturing, 80 staff.", created_at: "2026-04-05T14:05:00Z", author: "partner", },

  // Lead 109 — converted_verified
  {
    id: 1017, lead: 109, body:
      "Logistics company, 40 staff. Closed without telling us.",
    created_at: "2026-03-22T10:05:00Z", author: "partner", },

  // Lead 110 — not_converted
  {
    id: 1018, lead: 110, body: "Demo'd, expressed interest, ghosted.", created_at: "2026-03-13T11:05:00Z", author: "partner", },

  // Lead 111 — disputed_verifying
  {
    id: 1019, lead: 111, body:
      "Long evaluation. Atlas claims no sale; client said yes when SellWell asked. Verification in progress.",
    created_at: "2026-03-17T09:05:00Z", author: "partner", },

  // Lead 112 — expired (no notes after the initial brief)
  {
    id: 1020, lead: 112, body:
      "Imane heads a 40-person creative studio looking at Atlas Enterprise to consolidate client + project tracking. Atlas never reserved escrow within the 7-day window despite the warm intro — likely procurement bandwidth, not lack of interest. Lead expired naturally.",
    created_at: "2026-03-31T15:05:00Z", author: "partner", },

  // ── Company-authored notes (post-reservation, internal CRM trail) ──
  // Lead 103 — Atlas working the deal after reserving + revealing.
  {
    id: 1021, lead: 103, body:
      "Spoke with Sofiane on Monday. Pricing approved by their CFO, contract draft sent to their legal team. Targeting close by end of week.",
    created_at: "2026-05-04T15:30:00Z", author: "company",
  },
  {
    id: 1022, lead: 103, body:
      "Legal pushed back on data-residency clause; sent updated DPA referencing the Algiers data center. Awaiting response.",
    created_at: "2026-05-07T10:00:00Z", author: "company",
  },

  // Lead 104 — Atlas, smaller deal in flight
  {
    id: 1023, lead: 104, body:
      "Boutique owner confirmed she'll sign once she's back from Algiers next Tuesday. Light follow-up needed; deal mostly done.",
    created_at: "2026-04-29T14:00:00Z", author: "company",
  },

  // Lead 105 — Sahara Stack mid-window, technical eval still happening
  {
    id: 1024, lead: 105, body:
      "Their CTO is running latency benchmarks against the Algiers PoP this week. Strong signal — if numbers come back clean, expect a 12-month commitment.",
    created_at: "2026-04-15T11:20:00Z", author: "company",
  },
];

/**
 * Mock LeadDocument seed — files / external links the partner attached
 * to a lead. Free-row bucket per the data-model-spec.md `LeadDocument`
 * model (no fixed slots — unlike CampaignDocument).
 *
 * Seeded across drafts and in-flight leads so the Documents section in
 * the LeadDetailOverlay has something to render in both editable
 * (`status='draft'`) and read-only (post-submit) states. The `file` /
 * `url` fields point at /placeholder.* URLs so the existing
 * DocumentPreviewModal + DocumentCard primitives can render preview /
 * download buttons without needing real files.
 */
export const MOCK_LEAD_DOCUMENTS: LeadDocument[] = [
  // Lead 99 — draft, partner is gathering deal collateral
  {
    id: 2001, lead: 99, kind: "file",
    file: "/placeholder-pitch-deck.pdf",
    url: null,
    label: "Bouaziz Trading — discovery brief.pdf",
    sort_order: 0,
    created_at: "2026-05-08T17:00:00Z",
  },
  {
    id: 2002, lead: 99, kind: "url",
    file: null,
    url: "https://www.loom.com/share/placeholder",
    label: "Loom — first call recap (12 min)",
    sort_order: 1,
    created_at: "2026-05-09T09:20:00Z",
  },

  // Lead 100 — older draft with a quote attached
  {
    id: 2003, lead: 100, kind: "file",
    file: "/placeholder-pricing-sheet.pdf",
    url: null,
    label: "Sahara Stack — annual quote (draft).pdf",
    sort_order: 0,
    created_at: "2026-05-07T17:45:00Z",
  },

  // Lead 101 — submitted, proposal attached for the company to read
  {
    id: 2004, lead: 101, kind: "file",
    file: "/placeholder-one-pager.pdf",
    url: null,
    label: "Touati Imports — Atlas Pro proposal.pdf",
    sort_order: 0,
    created_at: "2026-05-07T18:30:00Z",
  },
  {
    id: 2005, lead: 101, kind: "url",
    file: null,
    url: "https://drive.google.com/placeholder",
    label: "WhatsApp screenshot — buying intent (Drive)",
    sort_order: 1,
    created_at: "2026-05-08T10:15:00Z",
  },

  // Lead 103 — acknowledged, signed contract waiting for legal
  {
    id: 2006, lead: 103, kind: "file",
    file: "/placeholder-pitch-deck.pdf",
    url: null,
    label: "Belkacem — signed proposal.pdf",
    sort_order: 0,
    created_at: "2026-05-04T14:25:00Z",
  },

  // Lead 106 — converted, kept for the record
  {
    id: 2007, lead: 106, kind: "file",
    file: "/placeholder-one-pager.pdf",
    url: null,
    label: "Benali Retail — final contract.pdf",
    sort_order: 0,
    created_at: "2026-05-05T13:00:00Z",
  },
];
