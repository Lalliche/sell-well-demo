/**
 * Mock profile + settings layer. Powers /settings for both roles.
 *
 * Backend swap notes per function:
 *   fetchCurrentUserProfile  → GET    /api/me/profile/   (returns the role-
 *                              specific profile slice; mock is the unified
 *                              partner-or-company profile row).
 *   updatePartnerProfile     → PATCH  /api/partner/profile/
 *   updateCompanyProfile     → PATCH  /api/company/profile/
 *   resubmitForReview        → POST   /api/me/resubmit/  (server flips
 *                              application_status back to pending_review,
 *                              clears application_review_notes, stamps
 *                              updated_at; no body required).
 *
 * Mutations write into the seed arrays directly so the AuthProvider's next
 * read picks up the new values (AuthProvider.readStoredUser() looks up the
 * live row from MOCK_USERS by id every call).
 */

import { MOCK_USERS } from "./_seed/users";
import { MOCK_PARTNER_PROFILES } from "./_seed/partner-profiles";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";
import { MOCK_BANKING_INFO } from "./_seed/banking-info";
import { getPlatformSetting } from "./admin";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── BankingInfo (polymorphic over partner + company) ─────────────────── */

/**
 * fetchBankingInfo(userId) — returns the BankingInfo row for the user, or
 * null when none is set up. Polymorphic — same fn for partners + companies
 * since BankingInfo was generalized to `OneToOne → User`. Backend swap:
 * GET /api/me/banking/. Admin role users never have banking info.
 */
export async function fetchBankingInfo(userId) {
  await sleep(180);
  if (typeof userId !== "number") return null;
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user || user.role === "admin") return null;
  return MOCK_BANKING_INFO.find((b) => b.user === userId) ?? null;
}

/**
 * saveBankingInfo(userId, patch) — upserts the user's BankingInfo row.
 * If a row exists, partial-update it; otherwise insert a new one with the
 * next free id. Returns the saved row. Backend swap: PATCH /api/me/banking/.
 *
 * The mock does no shape validation — the form layer is the source of
 * truth for which fields are required given `payout_method` (CCP fields
 * required when method is "ccp" or "both", bank fields when "bank" or
 * "both", account_holder_name always required).
 */
export async function saveBankingInfo(userId, patch = {}) {
  await sleep(360);
  if (typeof userId !== "number") return null;
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user || user.role === "admin") return null;

  const idx = MOCK_BANKING_INFO.findIndex((b) => b.user === userId);
  if (idx === -1) {
    const nextId = MOCK_BANKING_INFO.length
      ? Math.max(...MOCK_BANKING_INFO.map((b) => b.id)) + 1
      : 1;
    const row = {
      id: nextId,
      user: userId,
      payout_method: patch.payout_method ?? "bank",
      ccp_account: patch.ccp_account ?? null,
      ccp_key: patch.ccp_key ?? null,
      bank_name: patch.bank_name ?? null,
      rib: patch.rib ?? null,
      account_holder_name: patch.account_holder_name ?? "",
    };
    MOCK_BANKING_INFO.push(row);
    return row;
  }
  MOCK_BANKING_INFO[idx] = { ...MOCK_BANKING_INFO[idx], ...patch };
  return MOCK_BANKING_INFO[idx];
}

/* ── Reads ────────────────────────────────────────────────────────────── */

/**
 * fetchCurrentUserProfile(userId) — returns the role-specific profile slice
 * for the current user. Backend will resolve this via GET /api/me/profile/
 * using session auth; mock takes the id explicitly because we don't carry
 * an auth context inside `lib/mock/`.
 */
export async function fetchCurrentUserProfile(userId) {
  await sleep(220);
  if (!userId) return null;
  // Real Supabase users have UUID string IDs — read profile from Supabase
  if (typeof userId === "string") {
    const { supabase } = await import("@/lib/supabase");
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    return data ?? null;
  }
  // Mock numeric-ID dev users
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user) return null;
  if (user.role === "sales_partner") return MOCK_PARTNER_PROFILES.find((p) => p.user === userId) ?? null;
  if (user.role === "company")       return MOCK_COMPANY_PROFILES.find((p) => p.user === userId) ?? null;
  return null;
}

/* ── Writes — Partner profile ─────────────────────────────────────────── */

/**
 * updatePartnerProfile(userId, patch) — partial update on the partner's
 * SalesPartnerProfile row. `patch` may contain any subset of:
 *   first_name, last_name, phone, bio, linkedin_url,
 *   profile_photo (URL string), cv_file (URL string),
 *   categories (number[]), skill_tags (number[])
 *
 * Returns the updated profile, or null when the user isn't a partner.
 */
export async function updatePartnerProfile(userId, patch = {}) {
  await sleep(400);
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user || user.role !== "sales_partner") return null;
  const idx = MOCK_PARTNER_PROFILES.findIndex((p) => p.user === userId);
  if (idx === -1) return null;
  MOCK_PARTNER_PROFILES[idx] = {
    ...MOCK_PARTNER_PROFILES[idx],
    ...patch,
  };
  return MOCK_PARTNER_PROFILES[idx];
}

/* ── Writes — Company profile ─────────────────────────────────────────── */

/**
 * updateCompanyProfile(userId, patch) — partial update on the company's
 * CompanyProfile row. `patch` may contain any subset of:
 *   company_name, industry (number), website (string|null),
 *   description, logo (URL string)
 */
export async function updateCompanyProfile(userId, patch = {}) {
  await sleep(400);

  // UUID = real Supabase user
  if (typeof userId === "string") {
    const { supabase } = await import("@/lib/supabase");
    const update = {};
    if (patch.company_name !== undefined) update.company_name = patch.company_name;
    if (patch.industry     !== undefined) update.industry     = patch.industry;
    if (patch.website      !== undefined) update.website      = patch.website;
    if (patch.description  !== undefined) update.description  = patch.description;
    // logo: the form passes a blob URL — upload the File to storage instead
    if (patch.logo !== undefined && patch.logoFile instanceof File) {
      const safe = patch.logoFile.name.replace(/[^a-z0-9.\-_]/gi, "_").slice(0, 60);
      const path = `${userId}/${Date.now()}-${safe}`;
      await supabase.storage.from("avatars").upload(path, patch.logoFile, { upsert: true });
      update.logo = supabase.storage.from("avatars").getPublicUrl(path).data?.publicUrl ?? null;
    } else if (patch.logo !== undefined && !patch.logo?.startsWith("blob:")) {
      update.logo = patch.logo;
    }
    const { data, error } = await supabase
      .from("profiles").update(update).eq("id", userId).select().single();
    if (error) return null;
    return data;
  }

  // Mock numeric-ID user
  const user = MOCK_USERS.find((u) => u.id === userId);
  if (!user || user.role !== "company") return null;
  const idx = MOCK_COMPANY_PROFILES.findIndex((p) => p.user === userId);
  if (idx === -1) return null;
  MOCK_COMPANY_PROFILES[idx] = { ...MOCK_COMPANY_PROFILES[idx], ...patch };
  return MOCK_COMPANY_PROFILES[idx];
}

/* ── Writes — Submit for re-review ────────────────────────────────────── */

/**
 * resubmitForReview(userId) — closes the verification loop after admin
 * sent the user a `more_info_requested` note (Phase 9.10) or rejected
 * them and the `reapplication_cooldown_days` has elapsed.
 *
 * Mutates MOCK_USERS[i] in place:
 *   application_status         → pending_review
 *   application_reviewed_at    → null
 *   application_review_notes   → null
 *   updated_at                 → now
 *
 * Returns the updated user, or { error } when the transition is invalid.
 *
 * Guardrails:
 *   - User must currently be in `more_info_requested` or `rejected`.
 *   - For `rejected`, the cooldown (default 30 days from `application_reviewed_at`)
 *     must have elapsed. Pages compute that before showing the CTA, but
 *     this fn enforces it server-side too so the API can't be bypassed.
 *
 * Cooldown is read live from PlatformSettings via `getPlatformSetting`
 * (key `reapplication_cooldown_days`, default 30). Admin edits in
 * /admin/settings instantly affect this guard's threshold.
 */
export async function resubmitForReview(userId) {
  await sleep(360);
  const idx = MOCK_USERS.findIndex((u) => u.id === userId);
  if (idx === -1) return { error: "not_found" };

  const user = MOCK_USERS[idx];
  if (user.role === "admin") return { error: "invalid_role" };
  if (
    user.application_status !== "more_info_requested" &&
    user.application_status !== "rejected"
  ) {
    return { error: "invalid_status" };
  }

  if (user.application_status === "rejected") {
    const reviewedAt = user.application_reviewed_at
      ? new Date(user.application_reviewed_at).getTime()
      : null;
    if (reviewedAt === null) return { error: "missing_reviewed_at" };
    const elapsedDays = Math.floor(
      (Date.now() - reviewedAt) / (24 * 60 * 60 * 1000),
    );
    const cooldownDays = getPlatformSetting("reapplication_cooldown_days", 30);
    if (elapsedDays < cooldownDays) {
      return { error: "cooldown_active", elapsedDays };
    }
  }

  MOCK_USERS[idx] = {
    ...user,
    application_status: "pending_review",
    application_reviewed_at: null,
    application_review_notes: null,
    updated_at: new Date().toISOString(),
  };
  return MOCK_USERS[idx];
}

/* ── Pre-existing stat stubs (untouched) ──────────────────────────────── */

// fetchPartnerStats() → GET /api/partner/stats/
export async function fetchPartnerStats() {
  await sleep(240);
  return null;
}

// fetchCompanyStats() → GET /api/company/stats/
export async function fetchCompanyStats() {
  await sleep(240);
  return null;
}

// fetchEarningsSummary() → GET /api/partner/earnings/summary/
export async function fetchEarningsSummary() {
  await sleep(220);
  return null;
}

// fetchCommissionHistory() → GET /api/partner/earnings/commissions/
export async function fetchCommissionHistory(filters = {}) {
  await sleep(260);
  void filters;
  return [];
}

// fetchWithdrawalHistory() → GET /api/partner/earnings/withdrawals/
export async function fetchWithdrawalHistory(filters = {}) {
  await sleep(260);
  void filters;
  return [];
}

/**
 * DEPRECATED: legacy single-role updateProfile. Kept exported so any prior
 * caller doesn't break — but new code should call `updatePartnerProfile` or
 * `updateCompanyProfile` directly so the call site is unambiguous.
 */
export async function updateProfile(payload) {
  await sleep(400);
  void payload;
  return null;
}
