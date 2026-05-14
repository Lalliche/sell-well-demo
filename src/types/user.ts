export type UserRole = "sales_partner" | "company" | "admin";
export type PayoutMethod = "ccp" | "bank" | "both";

/** Admin-review gate applied to both sales_partner and company roles.
 *  Default on signup is `pending_review`. Admins are seeded with `approved`.
 *  See shared-specs/auth-onboarding-spec.md → Verification Policy.
 *  Named `UserApplicationStatus` (not `ApplicationStatus`) to avoid colliding
 *  with the campaign-application enum in `./campaign.ts`. */
export type UserApplicationStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "more_info_requested";

export interface User {
  id: number;
  email: string;
  role: UserRole;
  is_email_verified: boolean;
  application_status: UserApplicationStatus;
  application_reviewed_at?: string | null;
  application_review_notes?: string | null;
  /** Admin-controlled long-term suspension. Replaces "delete" in V1
   *  (no soft-delete column in the data model; deleting a user with
   *  active leads / escrow would orphan financial state). Set + cleared
   *  by `suspendUser` / `unsuspendUser` in `lib/mock/admin.js`.
   *  See shared-specs/data-model-spec.md → User + FRONTEND_TODO 9.2. */
  is_suspended?: boolean;
  suspended_at?: string | null;
  google_oauth_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesPartnerProfile {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  phone?: string | null;
  bio: string;
  linkedin_url: string;
  profile_photo: string;
  cv_file: string;
  categories: number[];
  skill_tags: number[];
  is_banking_setup: boolean;
  /* Flag count is NOT stored here. It's computed on demand by counting
   * `Flag` rows where `Flag.user` is this partner's User. See
   * `shared-specs/data-model-spec.md` → Flag. The API surface still
   * returns `flag_count` on user-summary slices (`fetchUserById`,
   * `fetchDisputeBySlug`, `fetchFlags`) — that's the computed value. */
}

export interface CompanyProfile {
  id: number;
  user: number;
  company_name: string;
  industry: number;
  website?: string | null;
  description: string;
  logo: string;
  /* Flag count is NOT stored here — same rule as `SalesPartnerProfile`.
   * Computed by counting `Flag` rows for the company's User. */
}

/** BankingInfo — owned by a User (partner or company). Generalized
 *  2026-05-13 from the original partner-only model so the company-side
 *  withdrawal flow has a stored destination. See `data-model-spec.md`
 *  → BankingInfo. Admin users do not have banking info. */
export interface BankingInfo {
  id: number;
  user: number;
  payout_method: PayoutMethod;
  ccp_account?: string | null;
  ccp_key?: string | null;
  bank_name?: string | null;
  rib?: string | null;
  account_holder_name: string;
}

/** Authenticated session — wire shape returned by GET /api/me/.
 *  Discriminated union on `role` so TypeScript narrows `profile` shape:
 *    if (user.role === "company") user.profile.company_name; // ✅ typed
 *    if (user.role === "sales_partner") user.profile.bio;    // ✅ typed
 *    if (user.role === "admin") user.profile === null;       // ✅ typed
 *
 *  Backend implementation pattern: dj-rest-auth's USER_DETAILS_SERIALIZER
 *  overridden with a MeSerializer that resolves `profile` polymorphically
 *  by role. See memory/project_backend_me_endpoint.md. */
export type AuthUser =
  | (Omit<User, "role"> & { role: "sales_partner"; profile: SalesPartnerProfile })
  | (Omit<User, "role"> & { role: "company";       profile: CompanyProfile })
  | (Omit<User, "role"> & { role: "admin";         profile: null });
