import type { User } from "@/types/user";

/** Mock seed users — 6 partners, 3 companies, 1 admin = 10 users.
 *  Covers all 4 application_status states for testing the verification gates.
 *  Joins to MOCK_PARTNER_PROFILES / MOCK_COMPANY_PROFILES via `user.id`. */
export const MOCK_USERS: User[] = [
  /* ── Sales Partners (6) ────────────────────────────────────────────── */
  {
    id: 1,
    email: "partner@sellwell.dz",
    role: "sales_partner",
    is_email_verified: true,
    application_status: "approved",
    application_reviewed_at: "2026-04-22T09:00:00Z",
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-04-15T10:00:00Z",
    updated_at: "2026-04-22T09:00:00Z",
  },
  {
    id: 2,
    email: "partner2@sellwell.dz",
    role: "sales_partner",
    is_email_verified: true,
    application_status: "approved",
    application_reviewed_at: "2026-04-25T11:30:00Z",
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-04-18T14:00:00Z",
    updated_at: "2026-04-25T11:30:00Z",
  },
  {
    // Approved partner who was later suspended (e.g. repeated fake-lead flags).
    // Seeded suspended so /admin/users renders at least one row with the
    // inline Suspended pill + tests the "Only suspended" FilterPanel filter.
    id: 3,
    email: "partner3@sellwell.dz",
    role: "sales_partner",
    is_email_verified: true,
    application_status: "approved",
    application_reviewed_at: "2026-04-28T08:15:00Z",
    application_review_notes: null,
    is_suspended: true,
    suspended_at: "2026-05-05T10:00:00Z",
    google_oauth_id: null,
    created_at: "2026-04-20T09:30:00Z",
    updated_at: "2026-05-05T10:00:00Z",
  },
  {
    id: 4,
    email: "pending@sellwell.dz",
    role: "sales_partner",
    is_email_verified: true,
    application_status: "pending_review",
    application_reviewed_at: null,
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-05-05T16:00:00Z",
    updated_at: "2026-05-05T16:00:00Z",
  },
  {
    id: 5,
    email: "rejected@sellwell.dz",
    role: "sales_partner",
    is_email_verified: true,
    application_status: "rejected",
    application_reviewed_at: "2026-05-04T13:00:00Z",
    application_review_notes:
      "LinkedIn URL doesn't match the name on the profile. Bio reads as a generic template. Re-apply after 30 days with a real LinkedIn profile and a bio describing your actual sales experience.",
    google_oauth_id: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-04T13:00:00Z",
  },
  {
    id: 6,
    email: "needsinfo@sellwell.dz",
    role: "sales_partner",
    is_email_verified: true,
    application_status: "more_info_requested",
    application_reviewed_at: "2026-05-06T11:00:00Z",
    application_review_notes:
      "Your CV is missing — please upload a PDF or DOCX (max 10MB). Also, your phone number didn't reach you on the OTP attempt; please verify it's correct.",
    google_oauth_id: null,
    created_at: "2026-05-02T15:30:00Z",
    updated_at: "2026-05-06T11:00:00Z",
  },

  /* ── Tech Companies (3) ────────────────────────────────────────────── */
  {
    id: 7,
    email: "company@sellwell.dz",
    role: "company",
    is_email_verified: true,
    application_status: "approved",
    application_reviewed_at: "2026-04-20T10:00:00Z",
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-04-12T09:00:00Z",
    updated_at: "2026-04-20T10:00:00Z",
  },
  {
    id: 8,
    email: "company2@sellwell.dz",
    role: "company",
    is_email_verified: true,
    application_status: "approved",
    application_reviewed_at: "2026-04-26T14:00:00Z",
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-04-19T11:00:00Z",
    updated_at: "2026-04-26T14:00:00Z",
  },
  {
    // Maghreb HR — used as the COMPANY test for the `more_info_requested`
    // resubmit loop. Email already verified so the only outstanding gate
    // is admin review; clicking "Submit for re-review" on /settings should
    // flip them back to `pending_review` and they show up at the top of
    // /admin/verifications again with no cooldown.
    id: 9,
    email: "needsinfo-company@sellwell.dz",
    role: "company",
    is_email_verified: true,
    application_status: "more_info_requested",
    application_reviewed_at: "2026-05-06T11:30:00Z",
    application_review_notes:
      "Your company logo is a placeholder image — please upload a real logo (PNG or SVG, max 5MB). Also, the description currently reads as a marketing template; please describe what your product actually does in 2-3 sentences.",
    google_oauth_id: null,
    created_at: "2026-05-02T15:30:00Z",
    updated_at: "2026-05-06T11:30:00Z",
  },
  {
    // Fresh pending_review company — keeps /admin/verifications populated
    // on the pending tab after user 9 was moved to more_info_requested.
    id: 11,
    email: "pending-company@sellwell.dz",
    role: "company",
    is_email_verified: false,
    application_status: "pending_review",
    application_reviewed_at: null,
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-05-07T08:00:00Z",
    updated_at: "2026-05-07T08:00:00Z",
  },

  /* ── Admin (1) ─────────────────────────────────────────────────────── */
  {
    id: 10,
    email: "admin@sellwell.dz",
    role: "admin",
    is_email_verified: true,
    application_status: "approved",
    application_reviewed_at: "2026-01-01T00:00:00Z",
    application_review_notes: null,
    google_oauth_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-25T16:00:00Z",
  },
];

/** Default user IDs per role — used by the dev role-switcher and as the
 *  fallback when login() is called with an unknown email. */
export const DEFAULT_USER_BY_ROLE = {
  sales_partner: 1,    // partner@sellwell.dz (approved)
  company:       7,    // company@sellwell.dz (approved + escrow funded)
  admin:        10,    // admin@sellwell.dz
} as const;
