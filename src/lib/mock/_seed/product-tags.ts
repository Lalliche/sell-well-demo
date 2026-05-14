import type { ProductTag } from "@/types/campaign";

/** Product tags per shared-specs/auth-onboarding-spec.md (Predefined Lists →
 *  Product Tags). Used as: campaign.product_tags (many-to-many).
 *  Backend table: ProductTag (data-model-spec.md). */
export const MOCK_PRODUCT_TAGS: ProductTag[] = [
  { id: 1,  slug: "cloud-based",       name_en: "Cloud-based",       name_fr: "Cloud",                 is_active: true },
  { id: 2,  slug: "on-premise",        name_en: "On-premise",        name_fr: "On-premise",            is_active: true },
  { id: 3,  slug: "mobile-app",        name_en: "Mobile app",        name_fr: "Application mobile",    is_active: true },
  { id: 4,  slug: "api-first",         name_en: "API-first",         name_fr: "API-first",             is_active: true },
  { id: 5,  slug: "freemium",          name_en: "Freemium",          name_fr: "Freemium",              is_active: true },
  { id: 6,  slug: "subscription",      name_en: "Subscription",      name_fr: "Abonnement",            is_active: true },
  { id: 7,  slug: "one-time-license",  name_en: "One-time license",  name_fr: "Licence unique",        is_active: true },
  { id: 8,  slug: "open-source",       name_en: "Open source",       name_fr: "Open source",           is_active: true },
  { id: 9,  slug: "ai-powered",        name_en: "AI-powered",        name_fr: "Propulsé par l'IA",     is_active: true },
  { id: 10, slug: "no-code",           name_en: "No-code",           name_fr: "No-code",               is_active: true },
  { id: 11, slug: "multi-tenant",      name_en: "Multi-tenant",      name_fr: "Multi-tenant",          is_active: true },
  { id: 12, slug: "white-label",       name_en: "White-label",       name_fr: "White-label",           is_active: true },
  { id: 13, slug: "other",             name_en: "Other",             name_fr: "Autre",                 is_active: true },
];
