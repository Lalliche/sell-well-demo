import type { CompanyProfile } from "@/types/user";

/** Mock CompanyProfile seed. FK `user` → MOCK_USERS.id (company role only). */
const LOGO = (label: string) =>
  `https://placehold.co/200x200/EDF2FA/3B6ECC?text=${encodeURIComponent(label)}`;

export const MOCK_COMPANY_PROFILES: CompanyProfile[] = [
  {
    id: 1,
    user: 7,
    company_name: "Atlas CRM",
    industry: 1,                   // CRM
    website: "https://atlas-crm.dz",
    description:
      "Algeria's first locally-built CRM for SMBs. Cloud-native, Arabic-first, Chargily-integrated. Used by 200+ Algerian companies for sales pipeline and customer support.",
    logo: LOGO("Atlas"),
    // Atlas CRM is seeded with 2 historical flags so /admin/flags renders
    // a non-empty page on first paint. Resolving Lead 111 as "sale happened"
    // (against the company's denial) will increment this to 3 and trip the
    // ≥3-flag threshold alert in the admin UI.
  },
  {
    id: 2,
    user: 8,
    company_name: "Sahara Stack",
    industry: 9,                   // Cloud Infrastructure
    website: "https://saharastack.io",
    description:
      "Cloud infrastructure platform for North African startups. Managed Kubernetes, edge CDN, object storage in Algiers and Tunis data centers.",
    logo: LOGO("Sahara"),
  },
  {
    // Test company for the `more_info_requested` resubmit loop. Description
    // is deliberately marketing-template-ish + logo is a generic placeholder
    // so the admin note ("upload a real logo + describe what your product
    // actually does") matches reality. User 9 in MOCK_USERS.
    id: 3,
    user: 9,
    company_name: "Maghreb HR",
    industry: 4,                   // HR & Payroll
    website: null,
    description:
      "We provide cutting-edge solutions for modern businesses.",
    logo: LOGO("Logo"),
  },
  {
    // Fresh pending_review company. User 11 in MOCK_USERS.
    id: 4,
    user: 11,
    company_name: "Casbah Tech",
    industry: 8,                   // Cybersecurity
    website: "https://casbah-tech.dz",
    description:
      "Algeria-based managed-security service provider. SOC monitoring, vulnerability scanning, and incident response for SMBs and mid-market enterprises.",
    logo: LOGO("Casbah"),
  },
];
