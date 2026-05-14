import type { Category } from "@/types/campaign";

/** Marketplace categories per shared-specs/auth-onboarding-spec.md.
 *  Used as: campaign.category, target_industries, partner preferred_categories,
 *  and CompanyProfile.industry. */
export const MOCK_CATEGORIES: Category[] = [
  { id: 1,  slug: "crm",                     name_en: "CRM",                          name_fr: "CRM",                              is_active: true },
  { id: 2,  slug: "erp",                     name_en: "ERP",                          name_fr: "ERP",                              is_active: true },
  { id: 3,  slug: "accounting-finance",      name_en: "Accounting & Finance",         name_fr: "Comptabilité & Finance",           is_active: true },
  { id: 4,  slug: "hr-payroll",              name_en: "HR & Payroll",                 name_fr: "RH & Paie",                        is_active: true },
  { id: 5,  slug: "project-management",      name_en: "Project Management",           name_fr: "Gestion de projet",                is_active: true },
  { id: 6,  slug: "ecommerce",               name_en: "E-commerce",                   name_fr: "E-commerce",                       is_active: true },
  { id: 7,  slug: "marketing-automation",    name_en: "Marketing & Automation",       name_fr: "Marketing & Automatisation",       is_active: true },
  { id: 8,  slug: "cybersecurity",           name_en: "Cybersecurity",                name_fr: "Cybersécurité",                    is_active: true },
  { id: 9,  slug: "cloud-infrastructure",    name_en: "Cloud Infrastructure",         name_fr: "Infrastructure Cloud",             is_active: true },
  { id: 10, slug: "communication",           name_en: "Communication & Collaboration",name_fr: "Communication & Collaboration",    is_active: true },
  { id: 11, slug: "education",               name_en: "Education & E-learning",       name_fr: "Éducation & E-learning",           is_active: true },
  { id: 12, slug: "healthcare",              name_en: "Healthcare Tech",              name_fr: "Tech Santé",                       is_active: true },
  { id: 13, slug: "logistics",               name_en: "Logistics & Supply Chain",     name_fr: "Logistique & Supply Chain",        is_active: true },
  { id: 14, slug: "other",                   name_en: "Other",                        name_fr: "Autre",                            is_active: true },
];
