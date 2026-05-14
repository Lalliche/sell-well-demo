/**
 * Partner-side dashboard stats.
 *
 * Aggregates leads + partner-link sales + applications + banking-info into
 * the KPIs the Sales Partner Dashboard renders. Computed at call time so
 * mark-mutations on the underlying data flow through automatically.
 *
 * Backend swap (Phase 11+): each function maps to one endpoint:
 *   fetchPartnerStats          → GET /api/partner/stats/
 *   fetchPartnerActions        → GET /api/partner/actions/
 *   fetchPartnerCommissionTimeseries → GET /api/partner/commission-timeseries/?range=
 *   fetchPartnerLatestHotLeads → GET /api/leads/?status=submitted,acknowledged&ordering=-submitted_at&limit=
 *   fetchPartnerApprovedCampaigns → covered by campaigns.js fetchCampaigns({approvedFor})
 *
 * The wire shapes returned here are what the backend will mirror exactly,
 * so this file IS the contract for those endpoints.
 */

import { supabase } from "@/lib/supabase";
import { MOCK_LEADS } from "./_seed/leads";
import { MOCK_PARTNER_LINKS, MOCK_PARTNER_LINK_SALES } from "./_seed/partner-links";
import { MOCK_APPLICATIONS } from "./_seed/applications";
import { MOCK_BANKING_INFO } from "./_seed/banking-info";
import { MOCK_CAMPAIGNS } from "./_seed/campaigns";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Today reference. In the mock we use the literal session date so seed
 *  data reads consistently (timestamps in the seeds are anchored to
 *  2026-05-09). The real backend will use server `now()`. */
const NOW = new Date();

/* ── helpers ────────────────────────────────────────────────────────── */

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n) {
  return new Date(NOW.getTime() - n * 86_400_000);
}
function partnerIdForUser(userId) { return userId; }

/** Sum of `commission_amount` over an array of objects. */
function sumCommissions(rows) {
  return rows.reduce((acc, r) => acc + (r.commission_amount ?? 0), 0);
}

/** Trend % delta from `prev` → `curr`. Returns 0 when prev is 0 to avoid
 *  divide-by-zero exploding the UI. */
function pctDelta(curr, prev) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}

/** Build a daily commission sparkline series. Returns an array of N
 *  numbers (one per day in the lookback window), each = sum of that day's
 *  commissions across both flows (offline lead conversions + partner-link
 *  sales). */
function buildCommissionSparkline({ partnerId, days }) {
  const start = startOfDay(daysAgo(days - 1));
  const series = Array.from({ length: days }, () => 0);

  // Lead conversions — count commission on `resolved_at` for converted/converted_verified.
  for (const lead of MOCK_LEADS) {
    if (lead.sales_partner !== partnerId) continue;
    if (!["converted", "converted_verified"].includes(lead.status)) continue;
    if (!lead.resolved_at) continue;
    const t = startOfDay(lead.resolved_at).getTime();
    const idx = Math.floor((t - start.getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) series[idx] += lead.commission_amount ?? 0;
  }

  // Partner-link sales.
  const linkIds = new Set(
    MOCK_PARTNER_LINKS.filter((l) => l.sales_partner === partnerId).map((l) => l.id),
  );
  for (const sale of MOCK_PARTNER_LINK_SALES) {
    if (!linkIds.has(sale.partner_link)) continue;
    const t = startOfDay(sale.created_at).getTime();
    const idx = Math.floor((t - start.getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) series[idx] += sale.commission_amount ?? 0;
  }

  return series;
}

/* ── GET /api/partner/stats/ ────────────────────────────────────────── */

/**
 * Returns the full KPI band for the dashboard's overview row + the
 * operational row. Single round-trip, single cache key, single loading
 * state.
 *
 * Shape (locked — backend MUST mirror):
 *   {
 *     totalEarned:       { value, delta30d, sparkline30d },
 *     thisMonth:         { value, delta30d, sparkline30d },
 *     availableToWithdraw: { value, hasBanking },
 *     pendingInEscrow:   { value, count },
 *     clicks:            { value, delta30d },
 *     conversions:       { value, delta30d },
 *     conversionRate:    { value, delta30d },
 *     avgPerConversion:  { value, delta30d },
 *   }
 */
export async function fetchPartnerStats({ userId } = {}) {
  await sleep(280);

  if (typeof userId === "string") {
    // Fetch all leads for this partner from Supabase
    const { data: leads } = await supabase
      .from("leads")
      .select("status, commission_amount, platform_fee_amount, total_reservation, resolved_at")
      .eq("partner_id", userId);

    const allLeads = leads ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Start = new Date(now.getTime() - 30 * 86_400_000);
    const prev30Start = new Date(now.getTime() - 60 * 86_400_000);

    const converted = allLeads.filter((l) =>
      l.status === "converted" || l.status === "converted_verified"
    );
    const pending = allLeads.filter((l) =>
      l.status === "acknowledged" || l.status === "disputed_verifying"
    );

    const sum = (rows) => rows.reduce((a, r) => a + Number(r.commission_amount ?? 0), 0);

    const totalEarned = sum(converted);
    const thisMonth   = sum(converted.filter((l) => l.resolved_at && new Date(l.resolved_at) >= monthStart));
    const last30Total = sum(converted.filter((l) => l.resolved_at && new Date(l.resolved_at) >= last30Start));
    const prev30Total = sum(converted.filter((l) => {
      const t = l.resolved_at && new Date(l.resolved_at);
      return t && t >= prev30Start && t < last30Start;
    }));
    const pendingInEscrow = sum(pending);

    // Build a simple 30-day sparkline from resolved_at dates
    const sparkline = Array.from({ length: 30 }, () => 0);
    for (const l of converted) {
      if (!l.resolved_at) continue;
      const idx = Math.floor((new Date(l.resolved_at).getTime() - last30Start.getTime()) / 86_400_000);
      if (idx >= 0 && idx < 30) sparkline[idx] += Number(l.commission_amount ?? 0);
    }

    return {
      totalEarned:         { value: totalEarned, delta30d: pctDelta(last30Total, prev30Total), sparkline30d: sparkline },
      thisMonth:           { value: thisMonth,   delta30d: pctDelta(last30Total, prev30Total), sparkline30d: sparkline },
      availableToWithdraw: { value: totalEarned, hasBanking: false },
      pendingInEscrow:     { value: pendingInEscrow, count: pending.length },
      clicks:              { value: 0, delta30d: 0 },
      conversions:         { value: converted.length, delta30d: 0 },
      conversionRate:      { value: 0, delta30d: 0 },
      avgPerConversion:    { value: converted.length ? Math.round(totalEarned / converted.length) : 0, delta30d: 0 },
    };
  }

  if (typeof userId !== "number") return null;
  const partnerId = partnerIdForUser(userId);

  const monthStart = startOfMonth(NOW);
  const last30Start = startOfDay(daysAgo(30));
  const prev30Start = startOfDay(daysAgo(60));

  /* ── Money KPIs ─────────────────────────────────────────────────── */

  const partnerLeads = MOCK_LEADS.filter((l) => l.sales_partner === partnerId);
  const linkIds = new Set(
    MOCK_PARTNER_LINKS.filter((l) => l.sales_partner === partnerId).map((l) => l.id),
  );
  const partnerSales = MOCK_PARTNER_LINK_SALES.filter((s) => linkIds.has(s.partner_link));

  // Total earned (lifetime) — confirmed lead commissions + all link sales.
  const leadConverted = partnerLeads.filter((l) =>
    ["converted", "converted_verified"].includes(l.status),
  );
  const totalEarned = sumCommissions(leadConverted) + sumCommissions(partnerSales);

  // This month — same shape, scoped to current calendar month.
  const monthLeads = leadConverted.filter(
    (l) => l.resolved_at && new Date(l.resolved_at) >= monthStart,
  );
  const monthSales = partnerSales.filter(
    (s) => new Date(s.created_at) >= monthStart,
  );
  const thisMonth = sumCommissions(monthLeads) + sumCommissions(monthSales);

  // Last 30 / prev 30 deltas.
  const last30Leads = leadConverted.filter(
    (l) => l.resolved_at && new Date(l.resolved_at) >= last30Start,
  );
  const prev30Leads = leadConverted.filter(
    (l) =>
      l.resolved_at &&
      new Date(l.resolved_at) >= prev30Start &&
      new Date(l.resolved_at) < last30Start,
  );
  const last30Sales = partnerSales.filter(
    (s) => new Date(s.created_at) >= last30Start,
  );
  const prev30Sales = partnerSales.filter(
    (s) => new Date(s.created_at) >= prev30Start && new Date(s.created_at) < last30Start,
  );
  const last30Total = sumCommissions(last30Leads) + sumCommissions(last30Sales);
  const prev30Total = sumCommissions(prev30Leads) + sumCommissions(prev30Sales);

  // Sparklines (30-day daily series).
  const totalEarnedSparkline = buildCommissionSparkline({ partnerId, days: 30 });
  // For "This month" we want a series scoped to this month — pad with
  // zeros to keep length stable across cards.
  const thisMonthSparkline = (() => {
    const series = Array.from({ length: 30 }, () => 0);
    const start = startOfDay(daysAgo(29));
    const monthStartTs = monthStart.getTime();
    for (let i = 0; i < 30; i++) {
      const dayTs = start.getTime() + i * 86_400_000;
      if (dayTs < monthStartTs) continue;
      series[i] = totalEarnedSparkline[i];
    }
    return series;
  })();

  /* ── Available to withdraw + pending in escrow ──────────────────── */

  // Available = converted commissions not yet withdrawn. The mock has no
  // withdrawal records yet, so we treat all converted commissions as
  // available. Real backend will subtract `total_withdrawn` from earnings.
  const availableToWithdraw =
    sumCommissions(leadConverted) + sumCommissions(partnerSales);

  // Pending = leads in escrow-reserved-but-not-yet-resolved state.
  const pendingLeads = partnerLeads.filter((l) =>
    ["acknowledged", "disputed_verifying"].includes(l.status),
  );
  const pendingInEscrow = sumCommissions(pendingLeads);

  const hasBanking = MOCK_BANKING_INFO.some((b) => b.sales_partner === partnerId);

  /* ── Operational row (Partner Link funnel KPIs) ─────────────────── */

  const partnerLinks = MOCK_PARTNER_LINKS.filter((l) => l.sales_partner === partnerId);
  const lifetimeClicks      = partnerLinks.reduce((a, l) => a + l.total_clicks, 0);
  const lifetimeConversions = partnerLinks.reduce((a, l) => a + l.total_conversions, 0);

  const last30SalesCount = last30Sales.length;
  const prev30SalesCount = prev30Sales.length;

  // For clicks we don't have per-day click data in the mock — denormalized
  // counters only. Approximate: use the same window ratio as conversions.
  // Backend will compute properly from PartnerLinkClick.
  const clicksDelta = pctDelta(last30SalesCount, prev30SalesCount);

  const conversionRate = lifetimeClicks
    ? Math.round((lifetimeConversions / lifetimeClicks) * 1000) / 10
    : 0;
  const avgPerConversion = lifetimeConversions
    ? Math.round(sumCommissions(partnerSales) / lifetimeConversions)
    : 0;

  return {
    totalEarned: {
      value: totalEarned,
      delta30d: pctDelta(last30Total, prev30Total),
      sparkline30d: totalEarnedSparkline,
    },
    thisMonth: {
      value: thisMonth,
      delta30d: pctDelta(last30Total, prev30Total), // same window for now
      sparkline30d: thisMonthSparkline,
    },
    availableToWithdraw: {
      value: availableToWithdraw,
      hasBanking,
    },
    pendingInEscrow: {
      value: pendingInEscrow,
      count: pendingLeads.length,
    },
    clicks: {
      value: lifetimeClicks,
      delta30d: clicksDelta,
    },
    conversions: {
      value: lifetimeConversions,
      delta30d: pctDelta(last30SalesCount, prev30SalesCount),
    },
    conversionRate: {
      value: conversionRate,           // already a percentage
      delta30d: 0,                     // not enough data to compute meaningfully
    },
    avgPerConversion: {
      value: avgPerConversion,
      delta30d: 0,
    },
  };
}

/* ── GET /api/partner/actions/ ──────────────────────────────────────── */

/**
 * Synthesizes "Action required" items from existing data. No new model.
 * Each item:
 *   { id, type, severity, title, body, href?, deadlineISO? }
 *
 * Severity controls the visual tone (banner color):
 *   "warn"   — time-pressure (tracking window expiring, low escrow)
 *   "info"   — informational nudge (application approved, start sharing)
 *   "danger" — blocking (missing banking info while earnings > 0)
 */
export async function fetchPartnerActions({ userId } = {}) {
  await sleep(220);
  if (typeof userId === "string") return [];
  if (typeof userId !== "number") return [];
  const partnerId = partnerIdForUser(userId);
  const actions = [];

  // 1. Tracking windows expiring < 48h.
  const horizon = new Date(NOW.getTime() + 48 * 3600 * 1000);
  const expiring = MOCK_LEADS.filter(
    (l) =>
      l.sales_partner === partnerId &&
      l.status === "acknowledged" &&
      l.tracking_window_expires_at &&
      new Date(l.tracking_window_expires_at) <= horizon,
  );
  for (const lead of expiring) {
    actions.push({
      id: `lead-expiring-${lead.id}`,
      type: "lead_expiring",
      severity: "warn",
      title: `Tracking window closing — ${lead.client_full_name}`,
      body: "Follow up before the window closes or the lead expires.",
      href: `/leads/${lead.id}`,
      deadlineISO: lead.tracking_window_expires_at,
    });
  }

  // 2. Recently approved applications (last 7 days, partner hasn't acted).
  const sevenDaysAgo = daysAgo(7);
  const recentApprovals = MOCK_APPLICATIONS.filter(
    (a) =>
      a.sales_partner === partnerId &&
      a.status === "approved" &&
      a.reviewed_at &&
      new Date(a.reviewed_at) >= sevenDaysAgo,
  );
  for (const app of recentApprovals) {
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === app.campaign);
    if (!campaign) continue;
    actions.push({
      id: `app-approved-${app.id}`,
      type: "application_approved",
      severity: "info",
      title: `Approved · ${campaign.product_name}`,
      body: campaign.partner_links_enabled
        ? "You can now submit leads or generate a Partner Link."
        : "You can now submit leads.",
      href: `/marketplace/${campaign.id}`,
    });
  }

  // 3. Missing banking info while earnings exist.
  const hasBanking = MOCK_BANKING_INFO.some((b) => b.sales_partner === partnerId);
  if (!hasBanking) {
    actions.push({
      id: "banking-missing",
      type: "banking_missing",
      severity: "danger",
      title: "Add your banking info to withdraw",
      body: "You can earn without it, but withdrawals require either a CCP or bank RIB on file.",
      href: "/settings",
    });
  }

  return actions;
}

/* ── GET /api/partner/commission-timeseries/?range= ─────────────────── */

/**
 * Daily commission timeseries for the hero area chart.
 *
 * `range` ∈ "7d" | "30d" | "90d" | "12m". Returns an array of
 * `{ dateISO, current, previous }` points. `previous` is the value from
 * the same offset in the prior period — the chart overlays it as a faded
 * line behind `current` (Stripe / Mercury comparison pattern).
 *
 * For "12m" we bucket by month instead of day so the chart stays readable.
 */
export async function fetchPartnerCommissionTimeseries({ userId, range = "30d" } = {}) {
  await sleep(260);
  if (typeof userId === "string") {
    const now = new Date();
    const rangeDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[range] ?? 30;
    const startCurrent = new Date(now.getTime() - rangeDays * 86_400_000);
    const startPrev    = new Date(startCurrent.getTime() - rangeDays * 86_400_000);

    const { data: leads } = await supabase
      .from("leads")
      .select("commission_amount, resolved_at, status")
      .eq("partner_id", userId)
      .in("status", ["converted", "converted_verified"]);

    const current  = Array.from({ length: rangeDays }, () => 0);
    const previous = Array.from({ length: rangeDays }, () => 0);

    for (const l of leads ?? []) {
      if (!l.resolved_at) continue;
      const t   = new Date(l.resolved_at).getTime();
      const amt = Number(l.commission_amount ?? 0);
      const idxCur  = Math.floor((t - startCurrent.getTime()) / 86_400_000);
      const idxPrev = Math.floor((t - startPrev.getTime())    / 86_400_000);
      if (idxCur  >= 0 && idxCur  < rangeDays) current[idxCur]   += amt;
      if (idxPrev >= 0 && idxPrev < rangeDays) previous[idxPrev] += amt;
    }

    return current.map((value, i) => ({
      dateISO: new Date(startCurrent.getTime() + i * 86_400_000).toISOString(),
      current: value,
      previous: previous[i],
    }));
  }
  if (typeof userId !== "number") return [];
  const partnerId = partnerIdForUser(userId);

  const rangeDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[range] ?? 30;
  const granularity = range === "12m" ? "month" : "day";

  if (granularity === "day") {
    const current  = buildCommissionSparkline({ partnerId, days: rangeDays });
    // Previous-period series. We re-run the same builder but anchored
    // back by `rangeDays`. Crude trick: temporarily shift `NOW`'s
    // reference inside the builder isn't worth it; instead replay the
    // logic inline.
    const start = startOfDay(daysAgo(rangeDays * 2 - 1));
    const previous = Array.from({ length: rangeDays }, () => 0);

    for (const lead of MOCK_LEADS) {
      if (lead.sales_partner !== partnerId) continue;
      if (!["converted", "converted_verified"].includes(lead.status)) continue;
      if (!lead.resolved_at) continue;
      const t = startOfDay(lead.resolved_at).getTime();
      const idx = Math.floor((t - start.getTime()) / 86_400_000);
      if (idx >= 0 && idx < rangeDays) previous[idx] += lead.commission_amount ?? 0;
    }
    const linkIds = new Set(
      MOCK_PARTNER_LINKS.filter((l) => l.sales_partner === partnerId).map((l) => l.id),
    );
    for (const sale of MOCK_PARTNER_LINK_SALES) {
      if (!linkIds.has(sale.partner_link)) continue;
      const t = startOfDay(sale.created_at).getTime();
      const idx = Math.floor((t - start.getTime()) / 86_400_000);
      if (idx >= 0 && idx < rangeDays) previous[idx] += sale.commission_amount ?? 0;
    }

    const todayStart = startOfDay(daysAgo(rangeDays - 1));
    return current.map((value, i) => ({
      dateISO: new Date(todayStart.getTime() + i * 86_400_000).toISOString(),
      current: value,
      previous: previous[i],
    }));
  }

  // 12-month: bucket by month for the last 12 months + prior 12 months.
  const months = 12;
  const out = [];
  for (let i = months - 1; i >= 0; i--) {
    const cur = new Date(NOW);
    cur.setMonth(cur.getMonth() - i);
    cur.setDate(1);
    cur.setHours(0, 0, 0, 0);
    const next = new Date(cur);
    next.setMonth(next.getMonth() + 1);
    const prevPeriod = new Date(cur);
    prevPeriod.setFullYear(prevPeriod.getFullYear() - 1);
    const prevPeriodNext = new Date(prevPeriod);
    prevPeriodNext.setMonth(prevPeriodNext.getMonth() + 1);

    const linkIds = new Set(
      MOCK_PARTNER_LINKS.filter((l) => l.sales_partner === partnerId).map((l) => l.id),
    );

    let current = 0;
    let previous = 0;
    for (const lead of MOCK_LEADS) {
      if (lead.sales_partner !== partnerId) continue;
      if (!["converted", "converted_verified"].includes(lead.status)) continue;
      if (!lead.resolved_at) continue;
      const t = new Date(lead.resolved_at);
      if (t >= cur && t < next) current += lead.commission_amount ?? 0;
      if (t >= prevPeriod && t < prevPeriodNext) previous += lead.commission_amount ?? 0;
    }
    for (const sale of MOCK_PARTNER_LINK_SALES) {
      if (!linkIds.has(sale.partner_link)) continue;
      const t = new Date(sale.created_at);
      if (t >= cur && t < next) current += sale.commission_amount ?? 0;
      if (t >= prevPeriod && t < prevPeriodNext) previous += sale.commission_amount ?? 0;
    }

    out.push({
      dateISO: cur.toISOString(),
      current,
      previous,
    });
  }
  return out;
}

