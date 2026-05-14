export type CampaignStatus = "draft" | "active" | "paused" | "closed";
export type CommissionType = "percentage" | "flat";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type CompanySize = "1-10" | "11-50" | "51-200" | "200+";

export interface Category {
  id: number;
  name_en: string;
  name_fr: string;
  slug: string;
  is_active: boolean;
}

export interface SkillTag {
  id: number;
  name_en: string;
  name_fr: string;
  slug: string;
  is_active: boolean;
}

export interface ProductTag {
  id: number;
  name_en: string;
  name_fr: string;
  slug: string;
  is_active: boolean;
}

/** PricingTier — most campaigns have exactly one tier (the standard
 *  price). Multi-tier campaigns are the exception. The UI must collapse
 *  single-tier rendering across every surface (marketplace card, campaign
 *  detail, lead overlay, lead-submission form) per
 *  shared-specs/campaigns-marketplace-spec.md → Pricing Tiers. The wire
 *  shape doesn't change — `Campaign.pricing_tiers` is always an array,
 *  often with length 1. */
export interface PricingTier {
  id: number;
  campaign: number;
  name: string;
  price: number;
  sort_order: number;
}

export interface Campaign {
  id: number;
  company: number;
  product_name: string;
  /** URL-safe identifier used in user-facing routes (`/marketplace/[slug]`,
   *  `/campaigns/[slug]`). Auto-generated from product_name on insert with
   *  numeric collision suffix when needed (`atlas-crm`, `atlas-crm-2`).
   *  Renames append to CampaignSlugHistory rather than reassigning.
   *  See shared-specs/data-model-spec.md → Campaign + CampaignSlugHistory. */
  slug: string;
  description: string;
  product_image: string;
  category: number;
  product_tags: number[];
  target_industries: number[];
  target_company_size?: CompanySize[] | null;
  target_description?: string | null;
  requirements?: string | null;
  commission_type: CommissionType;
  commission_value: number;
  tracking_window_days: 30 | 60 | 90;
  partner_links_enabled: boolean;
  /** Required when partner_links_enabled=true. The merchant's product /
   *  pricing / signup page that `sellwell.dz/r/[code]` 302s to. SellWell
   *  never hosts the product page or runs checkout — every Partner Link
   *  is a click-recording redirect to the merchant's URL. */
  merchant_redirect_url?: string | null;
  /** Encrypted server-side. Never returned on the client wire — declared here only for completeness. */
  chargily_webhook_secret?: string | null;
  status: CampaignStatus;
  pricing_tiers: PricingTier[];
  created_at: string;
  updated_at: string;
}

/** Which Sales Kit slot a CampaignDocument fills.
 *  Four named slots (each at-most-one per campaign) + a free `other` bucket
 *  for overflow (case studies, FAQs, scripts, compliance docs). */
export type CampaignDocumentSlot =
  | "pitch_deck"
  | "one_pager"
  | "pricing_sheet"
  | "demo_video_url"
  | "other";

/** Sales-enablement document attached to a campaign. Surfaced as a card
 *  in the "Sales Kit" section on the partner-facing campaign detail page.
 *  All optional — a campaign can publish with zero documents. */
export interface CampaignDocument {
  id: number;
  campaign: number;
  slot: CampaignDocumentSlot;
  /** File URL. Set for every slot except `demo_video_url`. */
  file?: string | null;
  /** External video URL. Set only for `demo_video_url`. */
  url?: string | null;
  /** Display title on partner-side cards. Auto-set for named slots,
   *  user-set free text for `other` rows. */
  label: string;
  /** Used only inside the `other` bucket. Named slots render in fixed
   *  order (pitch_deck → one_pager → pricing_sheet → demo_video_url). */
  sort_order: number;
  /** Drives the "Updated 3 days ago" relative-time pill. */
  created_at: string;
  updated_at: string;
}

export interface CampaignApplication {
  id: number;
  campaign: number;
  sales_partner: number;
  pitch: string;
  status: ApplicationStatus;
  applied_at: string;
  reviewed_at?: string | null;
}
