/**
 * Mock admin layer. Powers every `/admin/*` page once those surfaces
 * are built. Reads + mutates `MOCK_*` seed arrays directly so that
 * page refreshes always reflect the latest admin action.
 *
 * Cross-module sync caveat: the user-side mocks (`escrow.js`,
 * `campaigns.js`, `auth.js`, etc.) snapshot the seed into local `_*`
 * arrays at module load. Admin mutations write to `MOCK_*` but those
 * snapshots don't refresh until route navigation / page reload. For
 * V1 mock infrastructure that's acceptable — admin operates a queue
 * then refreshes to see the user-side effect. Backend swap (Phase 11+)
 * fixes this automatically because every endpoint hits the DB.
 *
 * Backend swap: each function maps to one endpoint under /api/admin/.
 * Wire shapes are documented at the function level.
 *
 * Authority constraint (Phase 9 header — load-bearing):
 *   - Admin's lead visibility is restricted to `disputed_verifying`,
 *     `expired_verifying`, and `not_converted` statuses.
 *   - `fetchDisputes` is the ONLY function in the entire mock layer
 *     that exposes leads to admin. `fetchLeads` / `fetchCompanyLeads`
 *     do not accept an admin-scope flag.
 *   - Admin writes to a Lead row only via `resolveDispute`.
 */

import { MOCK_USERS } from "./_seed/users";
import { MOCK_PARTNER_PROFILES } from "./_seed/partner-profiles";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";
import { MOCK_CAMPAIGNS } from "./_seed/campaigns";
import { MOCK_LEADS } from "./_seed/leads";
import { MOCK_LEAD_VERIFICATIONS } from "./_seed/lead-verifications";
import { MOCK_FLAGS } from "./_seed/flags";

/** Compute a user's current flag count by counting `Flag` rows where
 *  `Flag.user === userId`. Mirrors the backend's `Count('flags_received')`
 *  annotation. Used by every admin surface that surfaces a flag tally. */
function _flagCountForUser(userId) {
  if (typeof userId !== "number") return 0;
  return MOCK_FLAGS.filter((f) => f.user === userId).length;
}

/** Latest `Flag.created_at` for a user — used as the "last flag" timestamp
 *  on the /admin/flags table. Returns null when the user has no flags. */
function _lastFlagDateForUser(userId) {
  if (typeof userId !== "number") return null;
  let latest = null;
  for (const f of MOCK_FLAGS) {
    if (f.user !== userId) continue;
    if (!latest || new Date(f.created_at) > new Date(latest)) latest = f.created_at;
  }
  return latest;
}

/** Recent Flag rows for a user, newest first. Used by the Activity section
 *  of the user-detail overlay to surface the real flag history (not just
 *  the count). */
function _recentFlagsForUser(userId, limit = 5) {
  if (typeof userId !== "number") return [];
  return MOCK_FLAGS
    .filter((f) => f.user === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}
import {
  MOCK_WALLETS,
  MOCK_WALLET_TRANSACTIONS,
  MOCK_WITHDRAWAL_REQUESTS,
} from "./_seed/escrow";
import {
  MOCK_PARTNER_LINKS,
  MOCK_PARTNER_LINK_SALES,
} from "./_seed/partner-links";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ADMIN_LEAD_STATUSES = [
  "disputed_verifying",
  "expired_verifying",
  "not_converted",
];

/* ─────────────────────────────────────────────────────────────────────
 * 9.1 /admin/dashboard
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Aggregated platform stats for the admin dashboard.
 *
 * Wire shape:
 *   {
 *     users: { total, partners, companies },
 *     signups: { week, month, trend, sparkline },  // sparkline = 7-day array
 *     campaigns_active,
 *     leads: { submitted, acknowledged, converted, disputed },
 *     revenue: { month, all_time },
 *     commissions_facilitated,
 *     escrow_held,
 *     disputes_open,
 *     queues: { verifications_pending, withdrawals_pending, disputes_open },
 *   }
 *
 * Aggregation composes from the seed (no new tables). Trend is a
 * coarse week-over-week percentage based on `created_at` buckets.
 */
export async function fetchAdminDashboardStats() {
  await sleep(280);

  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  const within = (iso, days) =>
    iso && now - new Date(iso).getTime() <= days * DAY;

  const partners = MOCK_USERS.filter((u) => u.role === "sales_partner");
  const companies = MOCK_USERS.filter((u) => u.role === "company");

  const signupsWeek = MOCK_USERS.filter(
    (u) => u.role !== "admin" && within(u.created_at, 7),
  ).length;
  const signupsMonth = MOCK_USERS.filter(
    (u) => u.role !== "admin" && within(u.created_at, 30),
  ).length;
  const signupsPrevWeek = MOCK_USERS.filter(
    (u) =>
      u.role !== "admin" &&
      u.created_at &&
      now - new Date(u.created_at).getTime() > 7 * DAY &&
      now - new Date(u.created_at).getTime() <= 14 * DAY,
  ).length;
  const trend =
    signupsPrevWeek > 0
      ? Math.round(((signupsWeek - signupsPrevWeek) / signupsPrevWeek) * 100)
      : 0;

  // 7-day sparkline: count non-admin signups per day bucket (day 6 = oldest, day 0 = today).
  const signupSparkline = Array.from({ length: 7 }, (_, i) => {
    const dayStart = now - (6 - i) * DAY;
    const dayEnd   = now - (5 - i) * DAY;
    return MOCK_USERS.filter(
      (u) =>
        u.role !== "admin" &&
        u.created_at &&
        new Date(u.created_at).getTime() >= dayStart &&
        new Date(u.created_at).getTime() < dayEnd,
    ).length;
  });

  const campaignsActive = MOCK_CAMPAIGNS.filter((c) => c.status === "active")
    .length;

  const leadsByStatus = (status) =>
    MOCK_LEADS.filter((l) => l.status === status).length;

  // Platform-fee revenue: sum platform_fee_amount on every WalletTransaction
  // of type `release_platform_fee` (offline leads) + every PartnerLinkSale
  // (online sales — fee not yet posted to wallet transactions in V1 seed).
  const feeFromTransactions = MOCK_WALLET_TRANSACTIONS.filter(
    (t) => t.type === "release_platform_fee",
  ).reduce((m, t) => m + Math.abs(t.amount ?? 0), 0);
  const feeFromLinks = MOCK_PARTNER_LINK_SALES.reduce(
    (m, s) => m + (s.platform_fee_amount ?? 0),
    0,
  );
  const monthCutoff = now - 30 * DAY;
  const feeFromTransactionsMonth = MOCK_WALLET_TRANSACTIONS.filter(
    (t) =>
      t.type === "release_platform_fee" &&
      new Date(t.created_at).getTime() >= monthCutoff,
  ).reduce((m, t) => m + Math.abs(t.amount ?? 0), 0);
  const feeFromLinksMonth = MOCK_PARTNER_LINK_SALES.filter(
    (s) => new Date(s.created_at).getTime() >= monthCutoff,
  ).reduce((m, s) => m + (s.platform_fee_amount ?? 0), 0);

  // Commissions facilitated: every `release_commission` transaction
  // + every PartnerLinkSale commission.
  const commissionsFromTransactions = MOCK_WALLET_TRANSACTIONS.filter(
    (t) => t.type === "release_commission",
  ).reduce((m, t) => m + Math.abs(t.amount ?? 0), 0);
  const commissionsFromLinks = MOCK_PARTNER_LINK_SALES.reduce(
    (m, s) => m + (s.commission_amount ?? 0),
    0,
  );

  // Escrow held = sum of total_deposited - total_paid_out - total_withdrawn
  // across all wallets. Reserved + available are both still "held."
  const escrowHeld = MOCK_WALLETS.reduce(
    (m, w) =>
      m +
      (w.total_deposited ?? 0) -
      (w.total_paid_out ?? 0) -
      (w.total_withdrawn ?? 0),
    0,
  );

  const disputesOpen = MOCK_LEADS.filter(
    (l) =>
      l.status === "disputed_verifying" || l.status === "expired_verifying",
  ).length;

  // Queue counts for the quick-action chips at the top of the dashboard.
  const verificationsPending = MOCK_USERS.filter(
    (u) => u.role !== "admin" && u.application_status === "pending_review",
  ).length;
  const withdrawalsPending = MOCK_WITHDRAWAL_REQUESTS.filter(
    (w) => w.status === "pending",
  ).length;

  /* ── Attention queues (top 3 each, oldest first) ─────────────────── */

  // Verifications: pending_review users, FIFO by created_at.
  const verificationsAttention = MOCK_USERS
    .filter((u) => u.role !== "admin" && u.application_status === "pending_review")
    .map((u) => {
      const presentation = _userPresentation(u);
      return {
        id: u.id,
        slug: presentation.slug,
        display_name: presentation.display_name,
        role: u.role,
        email: u.email,
        days_waiting: u.created_at
          ? Math.max(0, Math.floor((now - new Date(u.created_at).getTime()) / DAY))
          : 0,
      };
    })
    .sort((a, b) => b.days_waiting - a.days_waiting)
    .slice(0, 3);

  // Withdrawals: pending requests, oldest first.
  const withdrawalsAttention = MOCK_WITHDRAWAL_REQUESTS
    .filter((w) => w.status === "pending")
    .map((w) => {
      const user = MOCK_USERS.find((u) => u.id === w.user);
      let display_name = user?.email ?? `user-${w.user}`;
      if (user?.role === "sales_partner") {
        const p = MOCK_PARTNER_PROFILES.find((x) => x.user === user.id);
        if (p) display_name = `${p.first_name} ${p.last_name}`;
      } else if (user?.role === "company") {
        const c = MOCK_COMPANY_PROFILES.find((x) => x.user === user.id);
        if (c) display_name = c.company_name;
      }
      return {
        id: w.id,
        display_name,
        role: user?.role ?? null,
        amount: w.amount,
        payout_method: w.payout_method,
        days_waiting: w.requested_at
          ? Math.max(0, Math.floor((now - new Date(w.requested_at).getTime()) / DAY))
          : 0,
      };
    })
    .sort((a, b) => b.days_waiting - a.days_waiting)
    .slice(0, 3);

  // Disputes: disputed_verifying + expired_verifying leads, oldest first.
  const disputesAttention = MOCK_LEADS
    .filter(
      (l) =>
        l.status === "disputed_verifying" || l.status === "expired_verifying",
    )
    .map((l) => {
      const campaign = MOCK_CAMPAIGNS.find((c) => c.id === l.campaign);
      const partner = MOCK_PARTNER_PROFILES.find((p) => p.id === l.sales_partner);
      const referenceDate = l.resolved_at ?? l.submitted_at ?? l.created_at;
      return {
        id: l.id,
        slug: l.slug,
        client_full_name: l.client_full_name,
        campaign_name: campaign?.product_name ?? null,
        partner_name: partner ? `${partner.first_name} ${partner.last_name}` : null,
        status: l.status,
        days_waiting: referenceDate
          ? Math.max(0, Math.floor((now - new Date(referenceDate).getTime()) / DAY))
          : 0,
      };
    })
    .sort((a, b) => b.days_waiting - a.days_waiting)
    .slice(0, 3);

  /* ── Leaderboards (top 4 each, with 30-day sparkline + delta pill) ──
   *
   * Sparkline = 30-day daily bucket array of the leaderboard's metric.
   * Delta = ((current 15d ÷ previous 15d) - 1) × 100, rounded.
   */

  const buildSparklineAndDelta = (createdAtList) => {
    const sparkline = Array.from({ length: 30 }, (_, i) => {
      const dayStart = now - (29 - i) * DAY;
      const dayEnd   = now - (28 - i) * DAY;
      return createdAtList.filter(
        (iso) => iso && new Date(iso).getTime() >= dayStart && new Date(iso).getTime() < dayEnd,
      ).length;
    });
    const half = sparkline.length / 2;
    const recent = sparkline.slice(half).reduce((a, b) => a + b, 0);
    const prior  = sparkline.slice(0, half).reduce((a, b) => a + b, 0);
    const delta =
      prior > 0 ? Math.round(((recent - prior) / prior) * 100)
                : recent > 0 ? 100 : 0;
    return { sparkline, delta };
  };

  // Top campaigns by leads count (last 30 days).
  const topCampaigns = MOCK_CAMPAIGNS
    .filter((c) => c.status === "active" || c.status === "paused")
    .map((c) => {
      const leadsForCampaign = MOCK_LEADS.filter(
        (l) =>
          l.campaign === c.id &&
          l.status !== "draft" &&
          l.submitted_at &&
          now - new Date(l.submitted_at).getTime() <= 30 * DAY,
      );
      const company = MOCK_COMPANY_PROFILES.find((cp) => cp.id === c.company);
      const { sparkline, delta } = buildSparklineAndDelta(
        leadsForCampaign.map((l) => l.submitted_at),
      );
      return {
        id: c.id,
        slug: c.slug,
        product_name: c.product_name,
        company_name: company?.company_name ?? null,
        company_logo: company?.logo ?? null,
        metric_value: leadsForCampaign.length,
        sparkline,
        delta,
      };
    })
    .filter((row) => row.metric_value > 0)
    .sort((a, b) => b.metric_value - a.metric_value)
    .slice(0, 4);

  // Top partners by commission earned (last 30 days).
  // Combines offline lead commissions (release_commission wallet tx) +
  // online partner-link sale commissions.
  const partnerCommissionMap = new Map();
  const partnerCommissionDatesMap = new Map();

  // Offline leads — sum release_commission tx for each lead's partner.
  MOCK_WALLET_TRANSACTIONS
    .filter(
      (t) =>
        t.type === "release_commission" &&
        new Date(t.created_at).getTime() >= now - 30 * DAY,
    )
    .forEach((t) => {
      const lead = MOCK_LEADS.find((l) => l.id === t.related_lead);
      if (!lead) return;
      const pid = lead.sales_partner;
      const prev = partnerCommissionMap.get(pid) ?? 0;
      partnerCommissionMap.set(pid, prev + Math.abs(t.amount ?? 0));
      const dates = partnerCommissionDatesMap.get(pid) ?? [];
      dates.push(t.created_at);
      partnerCommissionDatesMap.set(pid, dates);
    });

  // Online — partner-link sales.
  MOCK_PARTNER_LINK_SALES
    .filter((s) => new Date(s.created_at).getTime() >= now - 30 * DAY)
    .forEach((s) => {
      const link = MOCK_PARTNER_LINKS.find((pl) => pl.id === s.partner_link);
      if (!link) return;
      const pid = link.sales_partner;
      const prev = partnerCommissionMap.get(pid) ?? 0;
      partnerCommissionMap.set(pid, prev + (s.commission_amount ?? 0));
      const dates = partnerCommissionDatesMap.get(pid) ?? [];
      dates.push(s.created_at);
      partnerCommissionDatesMap.set(pid, dates);
    });

  const topPartners = Array.from(partnerCommissionMap.entries())
    .map(([pid, total]) => {
      const profile = MOCK_PARTNER_PROFILES.find((p) => p.id === pid);
      if (!profile) return null;
      const user = MOCK_USERS.find((u) => u.id === profile.user);
      const slug = profile
        ? `${profile.first_name}-${profile.last_name}-${(user?.id ?? 0).toString(36)}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
        : null;
      const dates = partnerCommissionDatesMap.get(pid) ?? [];
      const { sparkline, delta } = buildSparklineAndDelta(dates);
      return {
        id: pid,
        slug,
        display_name: `${profile.first_name} ${profile.last_name}`,
        profile_photo: profile.profile_photo,
        metric_value: total,
        sparkline,
        delta,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.metric_value - a.metric_value)
    .slice(0, 4);

  // Top companies by total escrow funded (all-time deposits).
  const topCompanies = MOCK_COMPANY_PROFILES
    .map((c) => {
      const wallet = MOCK_WALLETS.find((w) => w.company === c.id);
      const totalDeposited = wallet?.total_deposited ?? 0;
      // Sparkline = daily deposit volume from this company's wallet
      // transactions of type `deposit` over the last 30 days.
      const depositDates = wallet
        ? MOCK_WALLET_TRANSACTIONS
            .filter(
              (t) =>
                t.wallet === wallet.id &&
                t.type === "deposit" &&
                new Date(t.created_at).getTime() >= now - 30 * DAY,
            )
            .map((t) => t.created_at)
        : [];
      const { sparkline, delta } = buildSparklineAndDelta(depositDates);
      return {
        id: c.id,
        slug: c.company_name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
        company_name: c.company_name,
        company_logo: c.logo,
        metric_value: totalDeposited,
        sparkline,
        delta,
      };
    })
    .filter((row) => row.metric_value > 0)
    .sort((a, b) => b.metric_value - a.metric_value)
    .slice(0, 4);

  return {
    users: {
      total: partners.length + companies.length,
      partners: partners.length,
      companies: companies.length,
    },
    signups: { week: signupsWeek, month: signupsMonth, trend, sparkline: signupSparkline },
    campaigns_active: campaignsActive,
    queues: {
      verifications_pending: verificationsPending,
      withdrawals_pending:   withdrawalsPending,
      disputes_open:         disputesOpen,
    },
    // Funnel uses CUMULATIVE counts (every lead that has ever passed
    // through the stage), not point-in-time per-status counts. A real
    // funnel narrows downstream; per-status counts can have downstream >
    // upstream when leads are in different terminal states, which renders
    // a broken (widening) funnel.
    //   submitted     = every non-draft lead (each was submitted at some point)
    //   acknowledged  = every lead whose escrow was reserved (acknowledged_at !== null)
    //   converted     = leads currently converted or converted_verified (terminal good)
    //   disputed      = leads currently disputed_verifying or expired_verifying
    leads: {
      submitted: MOCK_LEADS.filter((l) => l.status !== "draft").length,
      acknowledged: MOCK_LEADS.filter((l) => l.acknowledged_at != null).length,
      converted:
        leadsByStatus("converted") + leadsByStatus("converted_verified"),
      disputed: disputesOpen,
    },
    revenue: {
      month: feeFromTransactionsMonth + feeFromLinksMonth,
      all_time: feeFromTransactions + feeFromLinks,
    },
    commissions_facilitated: commissionsFromTransactions + commissionsFromLinks,
    escrow_held: escrowHeld,
    disputes_open: disputesOpen,
    attention: {
      verifications: verificationsAttention,
      withdrawals:   withdrawalsAttention,
      disputes:      disputesAttention,
    },
    leaderboards: {
      campaigns: topCampaigns,
      partners:  topPartners,
      companies: topCompanies,
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.2 /admin/users + 9.3 /admin/users/[slug]
 * ───────────────────────────────────────────────────────────────────── */

/** Resolve the role-appropriate profile + display name for a user row.
 *  Users don't get user-facing detail routes — the admin views them via the
 *  in-table detail overlay (9.2). No slug field. */
function _userPresentation(user) {
  if (user.role === "sales_partner") {
    const p = MOCK_PARTNER_PROFILES.find((x) => x.user === user.id);
    return {
      profile: p ?? null,
      display_name: p ? `${p.first_name} ${p.last_name}` : user.email,
    };
  }
  if (user.role === "company") {
    const c = MOCK_COMPANY_PROFILES.find((x) => x.user === user.id);
    return {
      profile: c ?? null,
      display_name: c ? c.company_name : user.email,
    };
  }
  return {
    profile: null,
    display_name: user.email,
  };
}

/**
 * fetchUsers({ role, application_status, suspended, search, sort }) → admin user table.
 * Returns rows enriched with display_name + role-specific profile.
 *
 * `suspended` is tri-state:
 *   - undefined / null / "all"  → return everyone (default)
 *   - "only"                    → only `is_suspended === true`
 *   - "hide"                    → only `is_suspended !== true`
 *
 * Per CLAUDE.md §3 every filter narrows server-side here; the page consumes
 * `data` as-is without client-side `.filter()`.
 */
export async function fetchUsers(filters = {}) {
  await sleep(260);
  const { role, application_status, suspended, search, sort } = filters;
  let rows = MOCK_USERS.filter((u) => u.role !== "admin").map((u) => ({
    ...u,
    ..._userPresentation(u),
  }));

  if (role) rows = rows.filter((r) => r.role === role);
  if (application_status) {
    rows = rows.filter((r) => r.application_status === application_status);
  }
  if (suspended === "only") {
    rows = rows.filter((r) => r.is_suspended === true);
  } else if (suspended === "hide") {
    rows = rows.filter((r) => r.is_suspended !== true);
  }
  if (search && typeof search === "string") {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.email.toLowerCase().includes(q) ||
        (r.display_name ?? "").toLowerCase().includes(q),
    );
  }

  if (sort === "oldest_first") {
    rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else {
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  return rows;
}

/** fetchUserById(id) — resolves a user row + role-specific profile + role-
 *  specific activity counts (campaigns / leads / earnings / flags for partners;
 *  campaigns / escrow / leads received / commissions for companies). Powers
 *  the row-click detail overlay on /admin/users. */
export async function fetchUserById(id) {
  await sleep(180);
  const user = MOCK_USERS.find((u) => u.id === id);
  if (!user) return null;
  const presentation = _userPresentation(user);
  const activity = _userActivity(user);
  return { ...user, ...presentation, activity };
}

/** Aggregate per-user activity figures off the existing seeds. Composed for
 *  display, never persisted. Partner: approved_campaigns + leads_total +
 *  conversion_rate + earnings_total. Company: campaigns_total + leads_received +
 *  escrow_available + commissions_paid. */
function _userActivity(user) {
  if (user.role === "sales_partner") {
    const profile = MOCK_PARTNER_PROFILES.find((p) => p.user === user.id);
    const partnerLeads = MOCK_LEADS.filter((l) => l.sales_partner === user.id);
    const converted = partnerLeads.filter(
      (l) => l.status === "converted" || l.status === "converted_verified",
    );
    const earnings = converted.reduce(
      (sum, l) => sum + Number(l.commission_amount ?? 0),
      0,
    );
    return {
      approved_campaigns: profile
        ? MOCK_CAMPAIGNS.filter(
            (c) =>
              c.status === "active" &&
              MOCK_PARTNER_LINKS.some(
                (pl) => pl.sales_partner === user.id && pl.campaign === c.id,
              ),
          ).length
        : 0,
      leads_total: partnerLeads.length,
      conversion_rate: partnerLeads.length
        ? Math.round((converted.length / partnerLeads.length) * 100)
        : 0,
      earnings_total: earnings,
      flag_count: _flagCountForUser(user.id),
      recent_flags: _recentFlagsForUser(user.id),
    };
  }
  if (user.role === "company") {
    const profile = MOCK_COMPANY_PROFILES.find((p) => p.user === user.id);
    const companyCampaigns = profile
      ? MOCK_CAMPAIGNS.filter((c) => c.company === profile.id)
      : [];
    const leadsReceived = companyCampaigns.reduce(
      (sum, c) =>
        sum + MOCK_LEADS.filter((l) => l.campaign === c.id).length,
      0,
    );
    const wallet = MOCK_WALLETS.find((w) => w.company === profile?.id);
    const commissionsPaid = MOCK_WALLET_TRANSACTIONS.filter(
      (tx) => tx.wallet === wallet?.id && tx.type === "release_commission",
    ).reduce((sum, tx) => sum + Math.abs(Number(tx.amount ?? 0)), 0);
    return {
      campaigns_total: companyCampaigns.length,
      leads_received: leadsReceived,
      escrow_available: wallet
        ? Number(wallet.total_deposited ?? 0) -
          Number(wallet.total_reserved ?? 0) -
          Number(wallet.total_paid_out ?? 0) -
          Number(wallet.total_withdrawn ?? 0)
        : 0,
      commissions_paid: commissionsPaid,
      flag_count: _flagCountForUser(user.id),
      recent_flags: _recentFlagsForUser(user.id),
    };
  }
  return null;
}

function _mutateUser(id, patch) {
  const idx = MOCK_USERS.findIndex((u) => u.id === id);
  if (idx === -1) return null;
  MOCK_USERS[idx] = {
    ...MOCK_USERS[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return MOCK_USERS[idx];
}

/** suspendUser(id) — sets is_suspended + suspended_at. */
export async function suspendUser(id) {
  await sleep(280);
  return _mutateUser(id, {
    is_suspended: true,
    suspended_at: new Date().toISOString(),
  });
}

/** unsuspendUser(id) — clears suspension. */
export async function unsuspendUser(id) {
  await sleep(260);
  return _mutateUser(id, { is_suspended: false, suspended_at: null });
}

/**
 * resetUserPassword(id) — V1 mock no-op (returns success). Backend will
 * email a reset link with a one-hour expiry.
 */
export async function resetUserPassword(id) {
  await sleep(220);
  const user = MOCK_USERS.find((u) => u.id === id);
  return user ? { ok: true, email: user.email } : null;
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.4 /admin/campaigns
 * ───────────────────────────────────────────────────────────────────── */

/**
 * fetchAllCampaigns({ status, category, company_id, search }) — admin campaign
 * table. Server-side filters per CLAUDE.md §3. Returns rows enriched with
 * company_name + company_logo + partners_count (approved applications) +
 * leads_count (non-draft leads).
 */
export async function fetchAllCampaigns(filters = {}) {
  await sleep(260);
  const { status, category, company_id, search } = filters;
  const { MOCK_APPLICATIONS } = await import("./_seed/applications");

  let rows = MOCK_CAMPAIGNS.map((c) => {
    const company = MOCK_COMPANY_PROFILES.find((cp) => cp.id === c.company);
    const partners_count = MOCK_APPLICATIONS.filter(
      (a) => a.campaign === c.id && a.status === "approved",
    ).length;
    const leads_count = MOCK_LEADS.filter(
      (l) => l.campaign === c.id && l.status !== "draft",
    ).length;
    return {
      ...c,
      company_name: company?.company_name ?? null,
      company_logo: company?.logo ?? null,
      partners_count,
      leads_count,
    };
  });

  if (status) rows = rows.filter((c) => c.status === status);
  if (category) rows = rows.filter((c) => c.category === category);
  if (typeof company_id === "number") {
    rows = rows.filter((c) => c.company === company_id);
  }
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.product_name.toLowerCase().includes(q) ||
        (r.company_name ?? "").toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows;
}

function _mutateCampaign(id, patch) {
  const idx = MOCK_CAMPAIGNS.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  MOCK_CAMPAIGNS[idx] = {
    ...MOCK_CAMPAIGNS[idx],
    ...patch,
    updated_at: new Date().toISOString(),
  };
  return MOCK_CAMPAIGNS[idx];
}

export async function forcePauseCampaign(id) {
  await sleep(280);
  return _mutateCampaign(id, { status: "paused" });
}

/** forceResumeCampaign(id) — flips a paused campaign back to active so admin
 *  can undo an over-eager pause without leaving the surface. Not in the
 *  original spec but the inverse is obvious; same shape as the partner-side
 *  resumeCampaign. */
export async function forceResumeCampaign(id) {
  await sleep(280);
  return _mutateCampaign(id, { status: "active" });
}

export async function forceCloseCampaign(id) {
  await sleep(280);
  return _mutateCampaign(id, { status: "closed" });
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.5 /admin/disputes + 9.6 /admin/disputes/[slug]
 * ───────────────────────────────────────────────────────────────────── */

/** Build the joined slice the dispute queue table renders. */
function _disputeRow(lead) {
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === lead.campaign);
  const company = campaign
    ? MOCK_COMPANY_PROFILES.find((cp) => cp.id === campaign.company)
    : null;
  const partner = MOCK_PARTNER_PROFILES.find(
    (p) => p.id === lead.sales_partner,
  );
  const now = Date.now();
  const referenceDate = lead.resolved_at ?? lead.submitted_at ?? lead.created_at;
  const days_waiting = referenceDate
    ? Math.max(
        0,
        Math.floor((now - new Date(referenceDate).getTime()) / 86400000),
      )
    : 0;

  // Client-verification timeout (PlatformSetting) — when admin opened the
  // dispute (resolved_at is null until the final ruling, so we anchor off
  // the verifying status's enter-point: submitted_at). Live read so admin
  // edits in /admin/settings instantly shift every dispute's escalation
  // deadline. Surfaced as `verification_deadline` on the row for the
  // future "needs investigation" attention badge.
  const verificationTimeoutDays = getPlatformSetting(
    "client_verification_timeout_days",
    14,
  );
  const verifyingAnchor = lead.submitted_at ?? lead.created_at;
  const verification_deadline =
    (lead.status === "disputed_verifying" || lead.status === "expired_verifying") &&
    verifyingAnchor
      ? new Date(
          new Date(verifyingAnchor).getTime() +
            verificationTimeoutDays * 86400000,
        ).toISOString()
      : null;

  return {
    ...lead,
    campaign_name: campaign?.product_name ?? null,
    company_name: company?.company_name ?? null,
    partner_name: partner
      ? `${partner.first_name} ${partner.last_name}`
      : null,
    days_waiting,
    verification_deadline,
  };
}

/**
 * fetchDisputes({ status, search, days_waiting_min }) — admin disputes queue.
 *
 * HARD RULE (authority constraint): this is the ONLY function in the
 * mock layer that exposes leads to admin. Status is restricted to the
 * three admin-visible values; anything else returns empty.
 *
 * All filtering server-side per CLAUDE.md §3 — search matches client name,
 * campaign product_name, partner name, and company name (case-insensitive
 * substring across those four). When DRF lands this maps to a
 * SearchFilter('client_full_name', 'campaign__product_name', ...) on the
 * viewset.
 */
export async function fetchDisputes(filters = {}) {
  await sleep(260);
  const { status, search, days_waiting_min } = filters;
  let rows = MOCK_LEADS.filter((l) => ADMIN_LEAD_STATUSES.includes(l.status));
  if (status) {
    if (!ADMIN_LEAD_STATUSES.includes(status)) return [];
    rows = rows.filter((l) => l.status === status);
  }
  rows = rows.map(_disputeRow);
  if (typeof days_waiting_min === "number") {
    rows = rows.filter((r) => r.days_waiting >= days_waiting_min);
  }
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((r) =>
      [r.client_full_name, r.campaign_name, r.partner_name, r.company_name]
        .some((field) => (field ?? "").toLowerCase().includes(q)),
    );
  }
  rows.sort((a, b) => b.days_waiting - a.days_waiting);
  return rows;
}

/**
 * fetchDisputeBySlug(slug) — guarded lookup. Returns null when the lead's
 * status is not in the admin-visible set, so partners deep-linking get
 * a 404 on the page side instead of a data leak.
 *
 * Returns the dispute row enriched with the FULL slices the detail page
 * needs to render without firing N additional queries:
 *
 *   - campaign       : full Campaign object including commission terms +
 *                      pricing_tiers (inlined per the type contract)
 *   - pricing_tier   : the selected PricingTier object (resolved from the
 *                      campaign's tier list by `lead.pricing_tier` id)
 *   - partner        : full SalesPartnerProfile + email + flag_count
 *   - company        : full CompanyProfile + email + flag_count
 *
 * This is the one-query shape the page consumes. fetchVerificationsForLead
 * still returns the outreach log separately so resolving/refetching them
 * stays cache-isolated.
 */
export async function fetchDisputeBySlug(slug) {
  await sleep(220);
  const lead = MOCK_LEADS.find((l) => l.slug === slug);
  if (!lead) return null;
  if (!ADMIN_LEAD_STATUSES.includes(lead.status)) return null;

  const base = _disputeRow(lead);

  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === lead.campaign) ?? null;
  const pricingTier =
    campaign?.pricing_tiers?.find((tier) => tier.id === lead.pricing_tier) ?? null;

  const partnerProfile = MOCK_PARTNER_PROFILES.find(
    (p) => p.id === lead.sales_partner,
  );
  const partnerUser = partnerProfile
    ? MOCK_USERS.find((u) => u.id === partnerProfile.user)
    : null;
  const partner = partnerProfile
    ? {
        ...partnerProfile,
        email: partnerUser?.email ?? null,
        // flag_count is computed from MOCK_FLAGS, never stored on the profile.
        flag_count: _flagCountForUser(partnerProfile.user),
        slug: partnerUser
          ? `${partnerProfile.first_name}-${partnerProfile.last_name}-${partnerUser.id.toString(36)}`
              .toLowerCase()
              .replace(/[^a-z0-9-]/g, "-")
          : null,
      }
    : null;

  const companyProfile = campaign
    ? MOCK_COMPANY_PROFILES.find((cp) => cp.id === campaign.company)
    : null;
  const companyUser = companyProfile
    ? MOCK_USERS.find((u) => u.id === companyProfile.user)
    : null;
  const company = companyProfile
    ? {
        ...companyProfile,
        email: companyUser?.email ?? null,
        flag_count: _flagCountForUser(companyProfile.user),
        slug: companyProfile.company_name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      }
    : null;

  return {
    ...base,
    campaign,
    pricing_tier_resolved: pricingTier,
    partner,
    company,
  };
}

/** Legacy id lookup for the same. */
export async function fetchDisputeById(id) {
  await sleep(200);
  const lead = MOCK_LEADS.find((l) => l.id === id);
  if (!lead || !ADMIN_LEAD_STATUSES.includes(lead.status)) return null;
  return _disputeRow(lead);
}

/**
 * fetchVerificationsForLead(slug) — outreach log for a dispute detail.
 * Returns LeadVerification rows newest-first.
 */
export async function fetchVerificationsForLead(slug) {
  await sleep(200);
  const lead = MOCK_LEADS.find((l) => l.slug === slug);
  if (!lead) return [];
  const rows = MOCK_LEAD_VERIFICATIONS.filter((v) => v.lead === lead.id);
  return [...rows].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
}

/** logOutreach(slug, { method, result, notes }) — appends a verification row. */
export async function logOutreach(slug, { method, result, notes } = {}) {
  await sleep(280);
  const lead = MOCK_LEADS.find((l) => l.slug === slug);
  if (!lead) return null;
  const nextId =
    MOCK_LEAD_VERIFICATIONS.reduce((m, v) => Math.max(m, v.id), 0) + 1;
  const row = {
    id: nextId,
    lead: lead.id,
    outreach_method: method ?? "email",
    outreach_date: new Date().toISOString(),
    result: result ?? "pending",
    admin_notes: notes ?? null,
    resolved_by: null,
    created_at: new Date().toISOString(),
  };
  MOCK_LEAD_VERIFICATIONS.push(row);
  return row;
}

/** addAdminNote(slug, { note }) — sugar for logOutreach with no method. */
export async function addAdminNote(slug, { note } = {}) {
  return logOutreach(slug, { method: "email", result: "pending", notes: note });
}

/**
 * resolveDispute(slug, { ruling, admin_notes }) — closes a dispute.
 *
 * `ruling` ∈ ('sale_happened' | 'no_sale').
 *
 *   - 'sale_happened'  → lead → 'converted_verified'; commission + fee
 *                        release from escrow; company flag_count += 1.
 *   - 'no_sale'        → lead → 'not_converted'; full reservation
 *                        returns to company escrow; partner flag_count += 1
 *                        (partner submitted a fake/unconverted lead).
 *
 * No 'needs_investigation' branch — the V1 design merges "log an outreach
 * attempt" and "internal investigation note" into a single Add-note flow,
 * driven by `logOutreach`. The audit log is one timeline; resolution is a
 * separate, deliberate decision via the two rulings above.
 *
 * Writes a final `LeadVerification` row with `resolved_by` set so the
 * outreach log shows who closed the dispute.
 */
export async function resolveDispute(slug, { ruling, admin_notes } = {}) {
  await sleep(400);
  const leadIdx = MOCK_LEADS.findIndex((l) => l.slug === slug);
  if (leadIdx === -1) return null;
  const lead = MOCK_LEADS[leadIdx];
  if (
    lead.status !== "disputed_verifying" &&
    lead.status !== "expired_verifying"
  ) {
    // Status guard: can only resolve in-flight verifications.
    return null;
  }
  if (ruling !== "sale_happened" && ruling !== "no_sale") {
    // Unknown ruling — reject up-front so the page surfaces an error.
    return null;
  }

  const resolved_by_admin = MOCK_USERS.find((u) => u.role === "admin")?.id ?? null;

  const resolvedAt = new Date().toISOString();
  let nextStatus = lead.status;
  let verificationResult = "pending";

  // Helper — append a Flag row. Mirrors what the backend will do inside
  // the resolveDispute service function's atomic transaction:
  //   Flag.objects.create(user=..., flagged_by=admin, lead=..., reason=...)
  // The user's flag_count is a computed Count('flags_received') aggregate;
  // we never store a counter. See shared-specs/data-model-spec.md → Flag.
  const appendFlag = (flaggedUserId, reason) => {
    const nextId = MOCK_FLAGS.length
      ? Math.max(...MOCK_FLAGS.map((f) => f.id)) + 1
      : 1;
    MOCK_FLAGS.push({
      id: nextId,
      user: flaggedUserId,
      flagged_by: 10, // seeded admin user
      lead: lead.id,
      reason,
      created_at: resolvedAt,
    });
  };

  if (ruling === "sale_happened") {
    nextStatus = "converted_verified";
    verificationResult = "reached_confirmed_sale";
    // Flag the COMPANY OWNER (User FK), not the CompanyProfile id.
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === lead.campaign);
    const companyProfile = campaign
      ? MOCK_COMPANY_PROFILES.find((cp) => cp.id === campaign.company)
      : null;
    if (companyProfile) {
      appendFlag(
        companyProfile.user,
        `Ruled 'sale_happened' on lead ${lead.slug} — company denied a confirmed sale. Commission released to the partner.`,
      );
    }
  } else if (ruling === "no_sale") {
    nextStatus = "not_converted";
    verificationResult = "reached_no_sale";
    // Flag the PARTNER OWNER (User FK), not the SalesPartnerProfile id.
    // Spec: ruling 'no_sale' against a confirmed-fake lead flags the
    // submitting partner. Mirrors the company-side flag above on
    // 'sale_happened'.
    const partnerProfile = MOCK_PARTNER_PROFILES.find(
      (p) => p.id === lead.sales_partner,
    );
    if (partnerProfile) {
      appendFlag(
        partnerProfile.user,
        `Ruled 'no_sale' on lead ${lead.slug} — client confirmed no purchase. Reservation returned to the company.`,
      );
    }
  }

  MOCK_LEADS[leadIdx] = {
    ...lead,
    status: nextStatus,
    resolved_at: resolvedAt,
  };

  const nextId =
    MOCK_LEAD_VERIFICATIONS.reduce((m, v) => Math.max(m, v.id), 0) + 1;
  const row = {
    id: nextId,
    lead: lead.id,
    outreach_method: "phone",
    outreach_date: resolvedAt,
    result: verificationResult,
    admin_notes:
      admin_notes ??
      (ruling === "sale_happened"
        ? "Client confirmed the sale. Ruling: sale happened."
        : "Client confirmed no purchase. Ruling: no sale."),
    resolved_by: resolved_by_admin,
    created_at: resolvedAt,
  };
  MOCK_LEAD_VERIFICATIONS.push(row);

  return { lead: MOCK_LEADS[leadIdx], verification: row };
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.7 /admin/flags
 * ───────────────────────────────────────────────────────────────────── */

/**
 * fetchFlags({ role, min_count, search }) — flagged users for /admin/flags.
 *
 * Polymorphic over sales_partner + company. Server-side filters per
 * CLAUDE.md §3 — `role` (single-select), `min_count` (≥N threshold),
 * `search` (display_name + email). `min_count = 0` shows every user
 * regardless of flag count; default `min_count = 1` matches the
 * "flagged" semantics of the page.
 *
 * Flag counts + last_flag_date are computed on demand from `MOCK_FLAGS`
 * (no denormalized counter — see data-model-spec.md → Flag, and the
 * backend research note in FRONTEND_TODO 9.7). Mirrors the future
 * `User.objects.annotate(flag_count=Count('flags_received'))` aggregate.
 *
 * Each row carries: id (profile id), user_id (User FK), role, display_name,
 * email, avatar URL, flag_count, last_flag_date.
 */
export async function fetchFlags(filters = {}) {
  await sleep(240);
  const { role, min_count = 1, search } = filters;

  const partnerRows = MOCK_PARTNER_PROFILES.map((p) => {
    const user = MOCK_USERS.find((u) => u.id === p.user);
    return {
      id: p.id,
      user_id: p.user,
      role: "sales_partner",
      display_name: `${p.first_name} ${p.last_name}`,
      email: user?.email ?? null,
      avatar: p.profile_photo ?? null,
      flag_count: _flagCountForUser(p.user),
      last_flag_date: _lastFlagDateForUser(p.user),
    };
  }).filter((r) => r.flag_count >= min_count);

  const companyRows = MOCK_COMPANY_PROFILES.map((c) => {
    const user = MOCK_USERS.find((u) => u.id === c.user);
    return {
      id: c.id,
      user_id: c.user,
      role: "company",
      display_name: c.company_name,
      email: user?.email ?? null,
      avatar: c.logo ?? null,
      flag_count: _flagCountForUser(c.user),
      last_flag_date: _lastFlagDateForUser(c.user),
    };
  }).filter((r) => r.flag_count >= min_count);

  let rows = [...partnerRows, ...companyRows];
  if (role) rows = rows.filter((r) => r.role === role);
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => b.flag_count - a.flag_count);
  return rows;
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.8 /admin/settings
 * ───────────────────────────────────────────────────────────────────── */

/**
 * Platform settings — single source of truth in this module until a
 * dedicated _seed/platform-settings.ts is created. Defaults match
 * data-model-spec.md → PlatformSetting.
 *
 * Each row has a `category` field that drives the grouping on
 * /admin/settings. Three groups:
 *   - "fees_escrow" : fee % + escrow minimum deposit
 *   - "windows"     : every time-window setting (days / minutes)
 *   - "files"       : upload size limits and similar I/O knobs
 */
const PLATFORM_SETTING_DEFAULTS = [
  { key: "platform_fee_percentage",           value: 10,   type: "percent",  category: "fees_escrow", description: "Percentage of the sale amount taken as platform fee." },
  { key: "escrow_min_deposit_da",             value: 1000, type: "currency", category: "fees_escrow", description: "Minimum deposit per escrow top-up, in DA." },
  { key: "lead_acknowledgment_window_days",   value: 7,    type: "days",     category: "windows",     description: "Days the company has to reserve & view a lead before it expires." },
  { key: "client_verification_timeout_days",  value: 14,   type: "days",     category: "windows",     description: "Days SellWell waits for a client verification reply before admin investigates." },
  { key: "reapplication_cooldown_days",       value: 30,   type: "days",     category: "windows",     description: "Days before a rejected partner can re-apply." },
  { key: "partner_link_attribution_window_days", value: 90, type: "days",    category: "windows",     description: "Days a Partner Link click remains eligible for attribution." },
  { key: "click_dedup_window_minutes",        value: 30,   type: "minutes",  category: "windows",     description: "Window for Partner Link click deduplication." },
  { key: "max_upload_size_mb",                value: 10,   type: "mb",       category: "files",       description: "Max file upload size for CVs, images, proofs, etc." },
];

const _settings = PLATFORM_SETTING_DEFAULTS.map((s) => ({
  ...s,
  updated_at: new Date().toISOString(),
}));

/**
 * Synchronous reader — single source of truth for every business value that
 * varies platform behavior. Replaces hardcoded magic numbers (PLATFORM_FEE_PCT,
 * REAPPLICATION_COOLDOWN_DAYS, etc.) across the mock layer.
 *
 * Returns the numeric value when the key exists, otherwise `fallback`.
 * Synchronous because mock-layer call sites don't have an async boundary
 * (they're inside `submitLead` / `confirmSale` / `acknowledgeLead` etc.);
 * backend swap = one fn body change to a memoized request-scoped cache.
 *
 * Always pass a fallback equal to the spec default so legacy callers stay
 * safe if the in-memory store ever loses a row.
 */
export function getPlatformSetting(key, fallback) {
  const row = _settings.find((s) => s.key === key);
  if (!row) return fallback;
  const v = typeof row.value === "number" ? row.value : Number(row.value);
  return Number.isFinite(v) ? v : fallback;
}

export async function fetchPlatformSettings() {
  await sleep(180);
  return [..._settings];
}

export async function updatePlatformSetting(key, value) {
  await sleep(220);
  const idx = _settings.findIndex((s) => s.key === key);
  if (idx === -1) return null;
  _settings[idx] = {
    ..._settings[idx],
    value,
    updated_at: new Date().toISOString(),
  };
  return _settings[idx];
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.9 /admin/reports
 * ───────────────────────────────────────────────────────────────────── */

/**
 * fetchAdminReports({ since, until, breakdown }) — coarse reports
 * payload. Returns the same numbers `fetchAdminDashboardStats` does
 * plus a few breakdown arrays. Lowest priority surface; refine when
 * backend ships real event data.
 */
export async function fetchAdminReports({ since, until } = {}) {
  await sleep(320);
  const sinceMs = since ? new Date(since).getTime() : 0;
  const untilMs = until ? new Date(until).getTime() : Date.now();
  const inWindow = (iso) => {
    const t = new Date(iso).getTime();
    return t >= sinceMs && t <= untilMs;
  };

  // Revenue (platform fees) in window.
  const revenue = MOCK_PARTNER_LINK_SALES.filter((s) => inWindow(s.created_at))
    .reduce((m, s) => m + (s.platform_fee_amount ?? 0), 0)
    + MOCK_WALLET_TRANSACTIONS.filter(
      (t) => t.type === "release_platform_fee" && inWindow(t.created_at),
    ).reduce((m, t) => m + Math.abs(t.amount ?? 0), 0);

  // Leads funnel.
  const funnel = {
    submitted: MOCK_LEADS.filter(
      (l) => l.submitted_at && inWindow(l.submitted_at),
    ).length,
    acknowledged: MOCK_LEADS.filter(
      (l) => l.acknowledged_at && inWindow(l.acknowledged_at),
    ).length,
    converted: MOCK_LEADS.filter(
      (l) =>
        (l.status === "converted" || l.status === "converted_verified") &&
        l.resolved_at &&
        inWindow(l.resolved_at),
    ).length,
  };

  return {
    revenue,
    funnel,
    // V1 stubs — fill out as the page lands.
    top_campaigns: [],
    top_partners: [],
    top_companies: [],
    escrow_balances: MOCK_WALLETS.map((w) => ({
      company: w.company,
      total_deposited: w.total_deposited,
      total_reserved: w.total_reserved,
      total_paid_out: w.total_paid_out,
      total_withdrawn: w.total_withdrawn,
    })),
    dispute_resolution_rate: 0,
  };
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.10 /admin/verifications
 * ───────────────────────────────────────────────────────────────────── */

const VERIFY_STATUSES = ["pending_review", "rejected", "more_info_requested"];

/**
 * fetchVerifications({ role, status, search }) — admin verification queue.
 * Returns rows enriched with full profile for the expandable detail.
 *
 * All filtering happens server-side here so the consumer never narrows the
 * React Query result client-side (see client/CLAUDE.md §3 — when DRF
 * `PageNumberPagination` lands, the client holds only one page; client-side
 * narrowing would silently hide matches on other pages).
 *
 *   role    : "sales_partner" | "company" | undefined
 *   status  : "pending_review" | "more_info_requested" | "rejected"
 *             (defaults to pending_review)
 *   search  : matches display_name or email (case-insensitive substring).
 */
export async function fetchVerifications(filters = {}) {
  await sleep(260);
  const { role, status, search } = filters;
  const effectiveStatus = status ?? "pending_review";
  let rows = MOCK_USERS.filter(
    (u) =>
      u.role !== "admin" &&
      VERIFY_STATUSES.includes(u.application_status) &&
      u.application_status === effectiveStatus,
  );
  if (role) rows = rows.filter((u) => u.role === role);

  const now = Date.now();
  rows = rows.map((u) => {
    const presentation = _userPresentation(u);
    const daysWaiting = u.created_at
      ? Math.max(
          0,
          Math.floor((now - new Date(u.created_at).getTime()) / 86400000),
        )
      : 0;
    return { ...u, ...presentation, days_waiting: daysWaiting };
  });

  // Search runs against display_name + email (mirror DRF
  // `SearchFilter` `?search=` behavior on a couple of fields).
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.display_name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q),
    );
  }

  // FIFO — oldest signup first.
  rows.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  return rows;
}

/** approveUser(id) — flips application_status to approved. */
export async function approveUser(id) {
  await sleep(300);
  return _mutateUser(id, {
    application_status: "approved",
    application_reviewed_at: new Date().toISOString(),
    application_review_notes: null,
  });
}

/** rejectUser(id, { reason }) — flips to rejected + stores reason. */
export async function rejectUser(id, { reason } = {}) {
  await sleep(300);
  if (!reason) return null;
  return _mutateUser(id, {
    application_status: "rejected",
    application_reviewed_at: new Date().toISOString(),
    application_review_notes: reason,
  });
}

/** requestMoreInfo(id, { note }) — flips to more_info_requested + stores note. */
export async function requestMoreInfo(id, { note } = {}) {
  await sleep(300);
  if (!note) return null;
  return _mutateUser(id, {
    application_status: "more_info_requested",
    application_reviewed_at: new Date().toISOString(),
    application_review_notes: note,
  });
}

/* ─────────────────────────────────────────────────────────────────────
 * 9.11 /admin/withdrawals
 * ───────────────────────────────────────────────────────────────────── */

/** Join a withdrawal row with requester profile + role for the table. */
function _withdrawalRow(w) {
  const user = MOCK_USERS.find((u) => u.id === w.user);
  let display_name = user?.email ?? `user-${w.user}`;
  if (user?.role === "sales_partner") {
    const p = MOCK_PARTNER_PROFILES.find((x) => x.user === user.id);
    if (p) display_name = `${p.first_name} ${p.last_name}`;
  } else if (user?.role === "company") {
    const c = MOCK_COMPANY_PROFILES.find((x) => x.user === user.id);
    if (c) display_name = c.company_name;
  }
  const now = Date.now();
  const days_waiting = w.requested_at
    ? Math.max(
        0,
        Math.floor((now - new Date(w.requested_at).getTime()) / 86400000),
      )
    : 0;
  return {
    ...w,
    requester_role: user?.role ?? null,
    display_name,
    email: user?.email ?? null,
    days_waiting,
  };
}

/**
 * fetchAdminWithdrawalRequests({ role, status, search, since }) — global
 * queue, polymorphic over partner + company requests. All filters are
 * server-side (see client/CLAUDE.md §3) so swapping to DRF later is a
 * one-file change.
 *
 *   role    : "sales_partner" | "company" | undefined
 *   status  : "pending" | "processing" | "completed" | "rejected"
 *   search  : matches display_name OR email (case-insensitive substring)
 *   since   : ISO date string; filters by requested_at ≥ since
 *
 * Sort: oldest requested first (FIFO).
 */
export async function fetchAdminWithdrawalRequests(filters = {}) {
  await sleep(280);
  const { role, status, search, since } = filters;
  let rows = MOCK_WITHDRAWAL_REQUESTS.map(_withdrawalRow);
  if (role) rows = rows.filter((r) => r.requester_role === role);
  if (status) rows = rows.filter((r) => r.status === status);
  if (since) {
    const t = new Date(since).getTime();
    rows = rows.filter((r) => new Date(r.requested_at).getTime() >= t);
  }
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.display_name ?? "").toLowerCase().includes(q) ||
        (r.email ?? "").toLowerCase().includes(q),
    );
  }
  rows.sort((a, b) => new Date(a.requested_at) - new Date(b.requested_at));
  return rows;
}

/** fetchAdminWithdrawalRequestById(id) — single-row lookup for the detail
 *  overlay. Returns the same enriched shape as the queue rows. */
export async function fetchAdminWithdrawalRequestById(id) {
  await sleep(180);
  const w = MOCK_WITHDRAWAL_REQUESTS.find((row) => row.id === id);
  if (!w) return null;
  return _withdrawalRow(w);
}

function _mutateWithdrawal(id, patch) {
  const idx = MOCK_WITHDRAWAL_REQUESTS.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  MOCK_WITHDRAWAL_REQUESTS[idx] = {
    ...MOCK_WITHDRAWAL_REQUESTS[idx],
    ...patch,
  };
  return MOCK_WITHDRAWAL_REQUESTS[idx];
}

/** markWithdrawalProcessing(id) — pending → processing. */
export async function markWithdrawalProcessing(id) {
  await sleep(260);
  return _mutateWithdrawal(id, {
    status: "processing",
    processed_at: new Date().toISOString(),
  });
}

/**
 * completeWithdrawal(id, proofFile) — processing → completed.
 *
 * Atomic flow:
 *   1. Status → 'completed', stamps proof_uploaded_at.
 *   2. For company requests: writes a `WalletTransaction` row of type
 *      `withdrawal` and links it via `wallet_transaction`.
 *   3. proof_document is stored as a placeholder URL — backend swaps
 *      this for the real upload path.
 *
 * Throws (returns null) if proofFile is missing — admin cannot mark
 * complete without proof. Caller must enforce in UI too.
 */
export async function completeWithdrawal(id, proofFile) {
  await sleep(400);
  if (!proofFile) return null;
  const wIdx = MOCK_WITHDRAWAL_REQUESTS.findIndex((w) => w.id === id);
  if (wIdx === -1) return null;
  const w = MOCK_WITHDRAWAL_REQUESTS[wIdx];

  // Placeholder proof URL — backend serves an upload URL here.
  const proofUrl =
    typeof proofFile === "string"
      ? proofFile
      : `/admin/proofs/withdrawal-${id}.pdf`;
  const completedAt = new Date().toISOString();

  // For company requests, write the wallet transaction + link it back.
  let walletTxId = null;
  const requester = MOCK_USERS.find((u) => u.id === w.user);
  if (requester?.role === "company") {
    const company = MOCK_COMPANY_PROFILES.find((cp) => cp.user === requester.id);
    if (company) {
      const wallet = MOCK_WALLETS.find((wl) => wl.company === company.id);
      if (wallet) {
        const walletIdx = MOCK_WALLETS.findIndex((wl) => wl.id === wallet.id);
        MOCK_WALLETS[walletIdx] = {
          ...wallet,
          total_withdrawn: (wallet.total_withdrawn ?? 0) + w.amount,
        };
        const availableNow =
          MOCK_WALLETS[walletIdx].total_deposited -
          MOCK_WALLETS[walletIdx].total_reserved -
          MOCK_WALLETS[walletIdx].total_paid_out -
          MOCK_WALLETS[walletIdx].total_withdrawn;
        const nextTxId =
          MOCK_WALLET_TRANSACTIONS.reduce((m, t) => Math.max(m, t.id), 0) + 1;
        const tx = {
          id: nextTxId,
          wallet: wallet.id,
          type: "withdrawal",
          amount: -w.amount,
          balance_after: availableNow,
          related_lead: null,
          description: `Manual disbursement — withdrawal #${id}`,
          chargily_payment_id: null,
          created_at: completedAt,
        };
        MOCK_WALLET_TRANSACTIONS.push(tx);
        walletTxId = tx.id;
      }
    }
  }

  MOCK_WITHDRAWAL_REQUESTS[wIdx] = {
    ...w,
    status: "completed",
    processed_at: w.processed_at ?? completedAt,
    proof_document: proofUrl,
    proof_uploaded_at: completedAt,
    wallet_transaction: walletTxId,
  };
  return MOCK_WITHDRAWAL_REQUESTS[wIdx];
}

/** rejectWithdrawal(id, { reason }) — pending/processing → rejected.
 *  Frozen amount is implicitly released because `fetchWallet` only
 *  freezes against `pending` + `processing` rows. No WalletTransaction. */
export async function rejectWithdrawal(id, { reason } = {}) {
  await sleep(300);
  if (!reason) return null;
  return _mutateWithdrawal(id, {
    status: "rejected",
    admin_notes: reason,
    processed_at: new Date().toISOString(),
  });
}
