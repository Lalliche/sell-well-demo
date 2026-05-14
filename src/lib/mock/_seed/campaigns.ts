import type { Campaign } from "@/types/campaign";

/**
 * Mock campaigns seed. FK `company` → MOCK_COMPANY_PROFILES.id.
 *
 * 6 campaigns covering all CampaignStatus values + percentage and flat
 * commissions. Used to populate the partner dashboard (approved campaigns,
 * marketplace) and (later) the company dashboard. Campaigns with
 * `partner_links_enabled=true` carry a `merchant_redirect_url` since
 * SellWell never hosts the product page — every Partner Link is a
 * click-recording redirect to the merchant's URL.
 *
 * Pricing tiers are inlined per the type contract — `Campaign.pricing_tiers`
 * is a one-to-many included on the wire shape so the frontend doesn't have
 * to do a second fetch for tier names/prices.
 */
export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    company: 1,                              // Atlas CRM
    product_name: "Atlas CRM",
    slug: "atlas-crm",
    description:
      "Algeria's first locally-built CRM for SMBs. Cloud-native, Arabic-first, Chargily-integrated.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Atlas+CRM",
    category: 1,                             // CRM
    product_tags: [1, 4],
    target_industries: [1, 3, 4, 7],
    target_company_size: ["11-50", "51-200"],
    target_description:
      "Algerian SMBs (10-200 employees) currently using spreadsheets or no CRM at all.",
    requirements:
      "B2B sales experience required. Local Algerian network preferred. Comfortable demoing software.",
    commission_type: "percentage",
    commission_value: 10,
    tracking_window_days: 60,
    partner_links_enabled: true,
    merchant_redirect_url: "https://atlascrm.dz/pricing",
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      { id: 1, campaign: 1, name: "Starter",    price: 8000,  sort_order: 1 },
      { id: 2, campaign: 1, name: "Pro",        price: 18000, sort_order: 2 },
      { id: 3, campaign: 1, name: "Enterprise", price: 45000, sort_order: 3 },
    ],
    created_at: "2026-04-10T08:00:00Z",
    updated_at: "2026-04-22T09:00:00Z",
  },
  {
    id: 2,
    company: 2,                              // Sahara Stack
    product_name: "Sahara Stack — Managed Kubernetes",
    slug: "sahara-stack-managed-kubernetes",
    description:
      "Production-ready Kubernetes for North African startups. Algiers + Tunis data centers, Chargily-billed.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Sahara+Stack",
    category: 9,                             // Cloud Infrastructure
    product_tags: [1, 12],
    target_industries: [9, 10],
    target_company_size: ["11-50", "51-200", "200+"],
    target_description:
      "Algerian / Tunisian SaaS startups currently on AWS or DigitalOcean wanting local data residency.",
    requirements:
      "Technical sales background. Comfortable in conversation about cloud infra (you don't need to deploy it, just sell it).",
    commission_type: "percentage",
    commission_value: 8,
    tracking_window_days: 90,
    partner_links_enabled: true,
    merchant_redirect_url: "https://saharastack.io/pricing",
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      { id: 4, campaign: 2, name: "Dev",         price: 12000, sort_order: 1 },
      { id: 5, campaign: 2, name: "Production",  price: 38000, sort_order: 2 },
      { id: 6, campaign: 2, name: "Scale",       price: 95000, sort_order: 3 },
    ],
    created_at: "2026-04-12T10:30:00Z",
    updated_at: "2026-04-25T14:00:00Z",
  },
  {
    id: 3,
    company: 3,                              // Maghreb HR
    product_name: "Maghreb HR — Payroll Automation",
    slug: "maghreb-hr-payroll",
    description:
      "Algerian payroll done right. CNAS, CASNOS, IRG handled automatically. End-of-month closes in 10 minutes.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Maghreb+HR",
    category: 4,                             // HR & Payroll
    product_tags: [1, 4],
    target_industries: [3, 4, 12],
    target_company_size: ["11-50", "51-200"],
    target_description:
      "Algerian companies with 15-200 employees still doing payroll in Excel.",
    requirements:
      "Comfortable explaining tax/social-charge concepts. Existing accounting / HR network is a plus.",
    commission_type: "flat",
    commission_value: 5000,
    tracking_window_days: 60,
    partner_links_enabled: false,
    merchant_redirect_url: null,
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      // Single-tier — standard convention. Maghreb HR sells one flat
      // price; the partner-facing UI hides the tier name.
      { id: 7, campaign: 3, name: "Standard",  price: 22000, sort_order: 1 },
    ],
    created_at: "2026-04-08T09:00:00Z",
    updated_at: "2026-04-20T11:00:00Z",
  },
  {
    id: 4,
    company: 1,                              // Atlas CRM (second product)
    product_name: "Atlas CRM — Enterprise Plus",
    slug: "atlas-crm-enterprise-plus",
    description:
      "Atlas CRM with custom integrations, dedicated support, and on-premise option for regulated industries.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Atlas+Enterprise",
    category: 1,
    product_tags: [2, 3],
    target_industries: [1, 8, 12],
    target_company_size: ["200+"],
    target_description: "Algerian enterprises 200+ with regulatory compliance needs.",
    requirements:
      "Enterprise sales experience required. Long sales cycles (3-6 months) — patience and follow-through essential.",
    commission_type: "percentage",
    commission_value: 12,
    tracking_window_days: 90,
    partner_links_enabled: false,
    merchant_redirect_url: null,
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      { id: 9,  campaign: 4, name: "Annual",    price: 180000, sort_order: 1 },
      { id: 10, campaign: 4, name: "Multi-year", price: 450000, sort_order: 2 },
    ],
    created_at: "2026-03-28T12:00:00Z",
    updated_at: "2026-04-18T15:00:00Z",
  },
  {
    id: 5,
    company: 2,                              // Sahara Stack (paused)
    product_name: "Sahara Stack — Edge CDN",
    slug: "sahara-stack-edge-cdn",
    description:
      "Low-latency CDN with edge nodes in Algiers, Oran, Constantine, and Tunis. Pay-per-GB.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Sahara+CDN",
    category: 9,
    product_tags: [1],
    target_industries: [6, 9, 10],
    target_company_size: ["1-10", "11-50"],
    target_description: null,
    requirements: null,
    commission_type: "percentage",
    commission_value: 5,
    tracking_window_days: 30,
    partner_links_enabled: true,
    merchant_redirect_url: "https://saharastack.io/cdn",
    chargily_webhook_secret: null,
    status: "paused",
    pricing_tiers: [
      { id: 11, campaign: 5, name: "Standard", price: 4500, sort_order: 1 },
    ],
    created_at: "2026-03-15T08:30:00Z",
    updated_at: "2026-04-05T16:00:00Z",
  },
  {
    id: 6,
    company: 3,                              // Maghreb HR (draft)
    product_name: "Maghreb HR — Performance Reviews",
    slug: "maghreb-hr-performance-reviews",
    description:
      "Add-on to Maghreb HR Payroll for structured performance review cycles. Coming soon.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Maghreb+Reviews",
    category: 4,
    product_tags: [1],
    target_industries: [4],
    target_company_size: ["51-200", "200+"],
    target_description: null,
    requirements: null,
    commission_type: "flat",
    commission_value: 3000,
    tracking_window_days: 30,
    partner_links_enabled: false,
    merchant_redirect_url: null,
    chargily_webhook_secret: null,
    status: "draft",
    pricing_tiers: [
      { id: 12, campaign: 6, name: "Per seat", price: 1200, sort_order: 1 },
    ],
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
  },

  /* ── Campaigns the partner has NOT applied to yet ────────────────────
   * Active campaigns added so the marketplace demonstrates the empty
   * application_status state (cards show "View →" CTA instead of a
   * status badge). One per company so the existing CompanyProfile rows
   * cover them — no new company seeds needed. */
  {
    id: 7,
    company: 1,                              // Atlas CRM (third product)
    product_name: "Atlas CRM — Field Sales Add-on",
    slug: "atlas-crm-field-sales",
    description:
      "Mobile-first add-on for field sales reps. Offline lead capture, route planning, daily check-ins. Pairs with Atlas Pro and Enterprise.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Atlas+Field",
    category: 1,
    product_tags: [1, 3],
    target_industries: [1, 6, 12],
    target_company_size: ["11-50", "51-200"],
    target_description:
      "Algerian companies with 5+ field sales reps already on Atlas CRM Pro/Enterprise.",
    requirements:
      "Field sales experience preferred. Comfortable demoing mobile UX.",
    commission_type: "percentage",
    commission_value: 15,
    tracking_window_days: 60,
    partner_links_enabled: false,
    merchant_redirect_url: null,
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      { id: 13, campaign: 7, name: "Per rep / month", price: 2500, sort_order: 1 },
    ],
    created_at: "2026-05-02T09:00:00Z",
    updated_at: "2026-05-06T11:00:00Z",
  },
  {
    id: 8,
    company: 2,                              // Sahara Stack (third product)
    product_name: "Sahara Stack — Object Storage",
    slug: "sahara-stack-object-storage",
    description:
      "S3-compatible object storage in Algiers and Tunis. Cheaper egress for North African users. Pay-as-you-go.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Sahara+S3",
    category: 9,
    product_tags: [1],
    target_industries: [6, 9, 10],
    target_company_size: ["1-10", "11-50", "51-200"],
    target_description:
      "Algerian / Tunisian SaaS startups storing user-generated content.",
    requirements: null,
    commission_type: "flat",
    commission_value: 8000,
    tracking_window_days: 60,
    partner_links_enabled: true,
    merchant_redirect_url: "https://saharastack.io/storage",
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      // Single-tier (pay-as-you-go represented as a single Standard
      // bucket). Multi-tier surfacing not needed.
      { id: 14, campaign: 8, name: "Standard", price: 6000, sort_order: 1 },
    ],
    created_at: "2026-04-30T13:00:00Z",
    updated_at: "2026-05-08T10:00:00Z",
  },
  {
    id: 9,
    company: 3,                              // Maghreb HR (third product)
    product_name: "Maghreb HR — Recruitment ATS",
    slug: "maghreb-hr-recruitment-ats",
    description:
      "Lightweight applicant tracking system. Tightly integrated with Maghreb HR Payroll for one-click hire-to-paycheck.",
    product_image:
      "https://placehold.co/400x300/EDF2FA/3B6ECC?text=Maghreb+ATS",
    category: 4,
    product_tags: [1],
    target_industries: [4],
    target_company_size: ["51-200", "200+"],
    target_description: "Companies hiring 10+ roles per quarter.",
    requirements: "HR / recruitment background is a plus.",
    commission_type: "percentage",
    commission_value: 12,
    tracking_window_days: 90,
    partner_links_enabled: true,
    merchant_redirect_url: "https://maghrebhr.dz/ats",
    chargily_webhook_secret: null,
    status: "active",
    pricing_tiers: [
      // Single-tier — Maghreb HR ATS launches with a single Standard
      // price. Tier name hidden in partner-facing UI.
      { id: 16, campaign: 9, name: "Standard", price: 35000, sort_order: 1 },
    ],
    created_at: "2026-04-26T11:00:00Z",
    updated_at: "2026-05-04T09:00:00Z",
  },
];
