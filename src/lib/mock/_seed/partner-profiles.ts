import type { SalesPartnerProfile } from "@/types/user";

/** Mock SalesPartnerProfile seed. FK `user` → MOCK_USERS.id.
 *  Photos served from placehold.co with the brand cream/accent palette.
 *  CVs point at a stable W3C-hosted dummy PDF. */
const PHOTO = (label: string) =>
  `https://placehold.co/200x200/EDF2FA/3B6ECC?text=${encodeURIComponent(label)}`;
const CV_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

export const MOCK_PARTNER_PROFILES: SalesPartnerProfile[] = [
  {
    id: 1,
    user: 1,
    first_name: "Ahmed",
    last_name: "Benali",
    phone: "+213 555 12 34 56",
    bio: "B2B SaaS sales for 8 years across Algiers. Specialized in CRM and ERP onboarding for SMBs. I close through real conversations — not paid ads.",
    linkedin_url: "https://linkedin.com/in/ahmed-benali",
    profile_photo: "https://randomuser.me/api/portraits/men/32.jpg",
    cv_file: CV_URL,
    categories: [1, 2, 3],         // CRM, ERP, Accounting & Finance
    skill_tags: [1, 2, 6, 7, 11],  // B2B, SaaS, Solution Selling, Consultative, Negotiation
    is_banking_setup: true,
  },
  {
    id: 2,
    user: 2,
    first_name: "Yasmine",
    last_name: "Khelifi",
    phone: "+213 661 22 11 88",
    bio: "Cybersecurity sales lead. 5 years selling endpoint protection and SIEM solutions to Algerian banks and telcos. Background: SOC analyst before moving to sales.",
    linkedin_url: "https://linkedin.com/in/yasmine-khelifi",
    profile_photo: PHOTO("YK"),
    cv_file: CV_URL,
    categories: [8, 9],            // Cybersecurity, Cloud Infrastructure
    skill_tags: [3, 10, 15],       // Enterprise, Technical, Cybersecurity Sales
    is_banking_setup: false,        // hasn't set up banking yet — withdraw button gated
  },
  {
    id: 3,
    user: 3,
    first_name: "Karim",
    last_name: "Boudiaf",
    phone: "+213 770 33 44 22",
    bio: "Cloud infrastructure consultant turned sales. I bring deep technical conversations to companies adopting AWS / Azure for the first time in MENA.",
    linkedin_url: "https://linkedin.com/in/karim-boudiaf",
    profile_photo: PHOTO("KB"),
    cv_file: CV_URL,
    categories: [9, 1],            // Cloud Infrastructure, CRM
    skill_tags: [10, 13, 6],       // Technical, Cloud, Solution Selling
    is_banking_setup: true,
  },
  {
    id: 4,
    user: 4,
    first_name: "Salim",
    last_name: "Mansouri",
    phone: "+213 540 11 22 33",
    bio: "5+ years in HR tech sales. Worked with Sage HR and BambooHR resellers in Algeria. Strong network in mid-market HR managers.",
    linkedin_url: "https://linkedin.com/in/salim-mansouri",
    profile_photo: PHOTO("SM"),
    cv_file: CV_URL,
    categories: [4, 1],            // HR & Payroll, CRM
    skill_tags: [1, 2, 9],         // B2B, SaaS, Relationship Building
    is_banking_setup: false,
  },
  {
    id: 5,
    user: 5,
    first_name: "Test",
    last_name: "User",
    phone: "+213 555 00 00 00",
    bio: "Looking forward to selling tech solutions.",
    linkedin_url: "https://linkedin.com/in/random-fake-profile-12345",
    profile_photo: PHOTO("TU"),
    cv_file: CV_URL,
    categories: [14],              // Other
    skill_tags: [16],              // Other
    is_banking_setup: false,
  },
  {
    id: 6,
    user: 6,
    first_name: "Nadia",
    last_name: "Moustafa",
    phone: "+213 555 99 88 77",
    bio: "Project management software sales. Working with consultants and agencies in Algiers and Oran.",
    linkedin_url: "https://linkedin.com/in/nadia-moustafa",
    profile_photo: PHOTO("NS"),
    cv_file: "",                   // missing CV — admin requested more info
    categories: [5, 10],           // Project Management, Communication
    skill_tags: [1, 5, 7],         // B2B, Account Management, Consultative
    is_banking_setup: false,
  },
];
