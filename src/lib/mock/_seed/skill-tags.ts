import type { SkillTag } from "@/types/campaign";

/** Sales Partner skill tags per shared-specs/auth-onboarding-spec.md. */
export const MOCK_SKILL_TAGS: SkillTag[] = [
  { id: 1,  slug: "b2b-sales",                name_en: "B2B Sales",                name_fr: "Ventes B2B",                  is_active: true },
  { id: 2,  slug: "saas-sales",               name_en: "SaaS Sales",               name_fr: "Ventes SaaS",                 is_active: true },
  { id: 3,  slug: "enterprise-sales",         name_en: "Enterprise Sales",         name_fr: "Ventes Enterprise",           is_active: true },
  { id: 4,  slug: "lead-generation",          name_en: "Lead Generation",          name_fr: "Génération de leads",         is_active: true },
  { id: 5,  slug: "account-management",       name_en: "Account Management",       name_fr: "Gestion de comptes",          is_active: true },
  { id: 6,  slug: "solution-selling",         name_en: "Solution Selling",         name_fr: "Vente de solutions",          is_active: true },
  { id: 7,  slug: "consultative-selling",     name_en: "Consultative Selling",     name_fr: "Vente consultative",          is_active: true },
  { id: 8,  slug: "cold-outreach",            name_en: "Cold Outreach",            name_fr: "Prospection à froid",         is_active: true },
  { id: 9,  slug: "relationship-building",    name_en: "Relationship Building",    name_fr: "Création de relations",       is_active: true },
  { id: 10, slug: "technical-sales",          name_en: "Technical Sales",          name_fr: "Ventes techniques",           is_active: true },
  { id: 11, slug: "negotiation",              name_en: "Negotiation",              name_fr: "Négociation",                 is_active: true },
  { id: 12, slug: "crm-expert",               name_en: "CRM Expert",               name_fr: "Expert CRM",                  is_active: true },
  { id: 13, slug: "cloud-solutions",          name_en: "Cloud Solutions",          name_fr: "Solutions Cloud",             is_active: true },
  { id: 14, slug: "erp-implementation",       name_en: "ERP Implementation",       name_fr: "Implémentation ERP",          is_active: true },
  { id: 15, slug: "cybersecurity-sales",      name_en: "Cybersecurity Sales",      name_fr: "Ventes Cybersécurité",        is_active: true },
  { id: 16, slug: "other",                    name_en: "Other",                    name_fr: "Autre",                       is_active: true },
];
