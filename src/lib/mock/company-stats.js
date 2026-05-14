/**
 * Company-side dashboard stats.
 *
 * Aggregates leads + applications + escrow + partner-link sales into the
 * KPIs the Tech Company Dashboard renders. Computed at call time so seed
 * mutations flow through automatically (same pattern as partner-stats.js).
 *
 * Backend swap (Phase 11+): each function maps to one endpoint:
 *   fetchCompanyStats             → GET /api/company/stats/
 *   fetchCompanyActions           → GET /api/company/actions/
 *   fetchCompanyCommissionTimeseries → GET /api/company/commissions-timeseries/?range=
 *
 * Wire shapes returned here are the contract for those endpoints.
 *
 * Convention: all monetary values in DZD integers. All sparkline arrays are
 * 30-element daily series. All trend deltas are integer percentages.
 */

import { supabase } from "@/lib/supabase";
import { MOCK_LEADS } from "./_seed/leads";
import { MOCK_CAMPAIGNS } from "./_seed/campaigns";
import { MOCK_APPLICATIONS } from "./_seed/applications";
import { MOCK_PARTNER_LINKS, MOCK_PARTNER_LINK_SALES } from "./_seed/partner-links";
import { MOCK_PARTNER_PROFILES } from "./_seed/partner-profiles";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
function pctDelta(curr, prev) {
  if (!prev) return 0;
  return Math.round(((curr - prev) / prev) * 100);
}
function sumCommissions(rows) {
  return rows.reduce((acc, r) => acc + (r.commission_amount ?? 0), 0);
}
function sumPlatformFees(rows) {
  return rows.reduce((acc, r) => acc + (r.platform_fee_amount ?? 0), 0);
}

/** All campaign IDs owned by a given company. */
function campaignIdsForCompany(companyId) {
  return new Set(
    MOCK_CAMPAIGNS.filter((c) => c.company === companyId).map((c) => c.id),
  );
}

/** All non-draft leads on the company's campaigns. Drafts are private to
 *  the partner — companies never see them. */
function companyLeads(companyId) {
  const campaignIds = campaignIdsForCompany(companyId);
  return MOCK_LEADS.filter(
    (l) => campaignIds.has(l.campaign) && l.status !== "draft",
  );
}

/** All applications on the company's campaigns. */
function companyApplications(companyId) {
  const campaignIds = campaignIdsForCompany(companyId);
  return MOCK_APPLICATIONS.filter((a) => campaignIds.has(a.campaign));
}

/** Build a daily commissions-paid sparkline. Each day = sum of commission +
 *  platform_fee released that day (status: converted | converted_verified). */
function buildPaidSparkline({ companyId, days }) {
  const start = startOfDay(daysAgo(days - 1));
  const series = Array.from({ length: days }, () => 0);
  const leads = companyLeads(companyId).filter(
    (l) =>
      ["converted", "converted_verified"].includes(l.status) && l.resolved_at,
  );
  for (const lead of leads) {
    const t = startOfDay(lead.resolved_at).getTime();
    const idx = Math.floor((t - start.getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) {
      series[idx] += (lead.commission_amount ?? 0) + (lead.platform_fee_amount ?? 0);
    }
  }
  return series;
}

/** Build a daily leads-received sparkline. Each day = number of leads
 *  submitted to the company's campaigns. */
function buildLeadsReceivedSparkline({ companyId, days }) {
  const start = startOfDay(daysAgo(days - 1));
  const series = Array.from({ length: days }, () => 0);
  for (const lead of companyLeads(companyId)) {
    if (!lead.submitted_at) continue;
    const t = startOfDay(lead.submitted_at).getTime();
    const idx = Math.floor((t - start.getTime()) / 86_400_000);
    if (idx >= 0 && idx < days) series[idx] += 1;
  }
  return series;
}

/* ── GET /api/company/stats/ ────────────────────────────────────────── */

/**
 * Returns the full KPI band for the dashboard's overview row.
 *
 * Wire shape (locked — backend MUST mirror):
 *   {
 *     commissionsPaid: { value, delta30d, sparkline30d },
 *     thisMonth:       { value, delta30d, sparkline30d },
 *     activePartners:  { value, delta30d },
 *     leadsThisMonth:  { value, delta30d, sparkline30d },
 *   }
 *
 * Definitions:
 *   commissionsPaid — lifetime sum of commission_amount on converted leads
 *                     PLUS commission_amount on partner-link sales tied to
 *                     this company's campaigns. The "what we've actually
 *                     paid out" number.
 *   thisMonth       — same, scoped to current calendar month.
 *   activePartners  — distinct sales partners with at least one approved
 *                     application on any of this company's campaigns.
 *   leadsThisMonth  — count of non-draft leads submitted to this company's
 *                     campaigns this calendar month.
 */
export async function fetchCompanyStats({ companyId } = {}) {
  await sleep(280);

  // UUID string = real Supabase company
  if (typeof companyId === "string") {
    const now = new Date();
    const monthStart   = new Date(now.getFullYear(), now.getMonth(), 1);
    const last30Start  = new Date(now.getTime() - 30 * 86_400_000);
    const prev30Start  = new Date(now.getTime() - 60 * 86_400_000);

    // All campaign IDs owned by this company
    const { data: campaignRows } = await supabase
      .from("campaigns")
      .select("id")
      .eq("company_id", companyId);
    const campaignIds = (campaignRows ?? []).map((c) => c.id);

    let activePartnersValue = 0;
    let allLeads = [];

    if (campaignIds.length > 0) {
      // Active partners
      const { data: approvedApps } = await supabase
        .from("applications")
        .select("partner_id")
        .in("campaign_id", campaignIds)
        .eq("status", "approved");
      activePartnersValue = new Set((approvedApps ?? []).map((a) => a.partner_id)).size;

      // Leads for commission + leads-this-month KPIs
      const { data: leads } = await supabase
        .from("leads")
        .select("status, commission_amount, platform_fee_amount, resolved_at, submitted_at")
        .in("campaign_id", campaignIds)
        .neq("status", "draft");
      allLeads = leads ?? [];
    }

    const sum = (rows, field = "commission_amount") =>
      rows.reduce((a, r) => a + Number(r[field] ?? 0), 0);

    const converted = allLeads.filter((l) =>
      l.status === "converted" || l.status === "converted_verified"
    );

    const commissionsPaid = sum(converted);
    const thisMonth = sum(
      converted.filter((l) => l.resolved_at && new Date(l.resolved_at) >= monthStart)
    );
    const last30 = sum(converted.filter((l) => l.resolved_at && new Date(l.resolved_at) >= last30Start));
    const prev30 = sum(converted.filter((l) => {
      const t = l.resolved_at && new Date(l.resolved_at);
      return t && t >= prev30Start && t < last30Start;
    }));

    const leadsThisMonth = allLeads.filter(
      (l) => l.submitted_at && new Date(l.submitted_at) >= monthStart
    ).length;
    const leadsLast30 = allLeads.filter(
      (l) => l.submitted_at && new Date(l.submitted_at) >= last30Start
    ).length;
    const leadsPrev30 = allLeads.filter((l) => {
      const t = l.submitted_at && new Date(l.submitted_at);
      return t && t >= prev30Start && t < last30Start;
    }).length;

    // 30-day sparkline
    const sparkline = Array.from({ length: 30 }, () => 0);
    for (const l of converted) {
      if (!l.resolved_at) continue;
      const idx = Math.floor((new Date(l.resolved_at).getTime() - last30Start.getTime()) / 86_400_000);
      if (idx >= 0 && idx < 30) sparkline[idx] += Number(l.commission_amount ?? 0);
    }

    return {
      commissionsPaid: { value: commissionsPaid, delta30d: pctDelta(last30, prev30), sparkline30d: sparkline },
      thisMonth:       { value: thisMonth,        delta30d: pctDelta(last30, prev30), sparkline30d: sparkline },
      activePartners:  { value: activePartnersValue, delta30d: 0 },
      leadsThisMonth:  { value: leadsThisMonth, delta30d: pctDelta(leadsLast30, leadsPrev30), sparkline30d: [] },
    };
  }

  if (typeof companyId !== "number") return null;

  const monthStart = startOfMonth(NOW);
  const last30Start = startOfDay(daysAgo(30));
  const prev30Start = startOfDay(daysAgo(60));

  /* ── Lead-side commissions ──────────────────────────────────────── */

  const leads = companyLeads(companyId);
  const converted = leads.filter((l) =>
    ["converted", "converted_verified"].includes(l.status),
  );

  const monthConverted = converted.filter(
    (l) => l.resolved_at && new Date(l.resolved_at) >= monthStart,
  );
  const last30Converted = converted.filter(
    (l) => l.resolved_at && new Date(l.resolved_at) >= last30Start,
  );
  const prev30Converted = converted.filter(
    (l) =>
      l.resolved_at &&
      new Date(l.resolved_at) >= prev30Start &&
      new Date(l.resolved_at) < last30Start,
  );

  /* ── Partner-link sales (company side, by campaign) ─────────────── */

  const campaignIds = campaignIdsForCompany(companyId);
  const linkIds = new Set(
    MOCK_PARTNER_LINKS.filter((l) => campaignIds.has(l.campaign)).map((l) => l.id),
  );
  const linkSales = MOCK_PARTNER_LINK_SALES.filter((s) => linkIds.has(s.partner_link));
  const monthLinkSales = linkSales.filter(
    (s) => new Date(s.created_at) >= monthStart,
  );
  const last30LinkSales = linkSales.filter(
    (s) => new Date(s.created_at) >= last30Start,
  );
  const prev30LinkSales = linkSales.filter(
    (s) =>
      new Date(s.created_at) >= prev30Start &&
      new Date(s.created_at) < last30Start,
  );

  // The company's "commissions paid" number is what they DISBURSED — that's
  // commission released to partners (lead-side) PLUS commission attributed
  // to partner-link sales. Platform fee is separate; not included here.
  const commissionsPaid =
    sumCommissions(converted) + sumCommissions(linkSales);
  const thisMonth =
    sumCommissions(monthConverted) + sumCommissions(monthLinkSales);
  const last30Total =
    sumCommissions(last30Converted) + sumCommissions(last30LinkSales);
  const prev30Total =
    sumCommissions(prev30Converted) + sumCommissions(prev30LinkSales);

  // Sparkline — commission + platform fee released per day. The 30-day
  // shape gives the trend pill context.
  const paidSparkline30 = buildPaidSparkline({ companyId, days: 30 });

  /* ── Active partners ─────────────────────────────────────────────── */

  const apps = companyApplications(companyId);
  const approvedNow = apps.filter((a) => a.status === "approved");
  const activePartnerIds = new Set(approvedNow.map((a) => a.sales_partner));

  // For the delta we count approvals that landed in the last 30 days vs
  // the prior 30 — a proxy for "team growth this period".
  const last30Approvals = approvedNow.filter(
    (a) => a.reviewed_at && new Date(a.reviewed_at) >= last30Start,
  );
  const prev30Approvals = approvedNow.filter(
    (a) =>
      a.reviewed_at &&
      new Date(a.reviewed_at) >= prev30Start &&
      new Date(a.reviewed_at) < last30Start,
  );

  /* ── Leads received this month ───────────────────────────────────── */

  const monthLeads = leads.filter(
    (l) => l.submitted_at && new Date(l.submitted_at) >= monthStart,
  );
  const last30Leads = leads.filter(
    (l) => l.submitted_at && new Date(l.submitted_at) >= last30Start,
  );
  const prev30Leads = leads.filter(
    (l) =>
      l.submitted_at &&
      new Date(l.submitted_at) >= prev30Start &&
      new Date(l.submitted_at) < last30Start,
  );
  const leadsSparkline30 = buildLeadsReceivedSparkline({ companyId, days: 30 });

  return {
    commissionsPaid: {
      value: commissionsPaid,
      delta30d: pctDelta(last30Total, prev30Total),
      sparkline30d: paidSparkline30,
    },
    thisMonth: {
      value: thisMonth,
      delta30d: pctDelta(last30Total, prev30Total),
      sparkline30d: paidSparkline30,
    },
    activePartners: {
      value: activePartnerIds.size,
      delta30d: pctDelta(last30Approvals.length, prev30Approvals.length),
    },
    leadsThisMonth: {
      value: monthLeads.length,
      delta30d: pctDelta(last30Leads.length, prev30Leads.length),
      sparkline30d: leadsSparkline30,
    },
  };
}

/* ── GET /api/company/actions/ ──────────────────────────────────────── */

/**
 * Synthesizes "Action required" items from existing data. Mirrors the
 * partner-side fetchPartnerActions contract. Each item:
 *   { id, type, severity, title, body, href?, deadlineISO? }
 *
 * Severity controls the visual tone:
 *   "warn"   — time-pressure (lead awaiting reservation, tracking expiring)
 *   "info"   — informational nudge (applications waiting for review)
 *   "danger" — blocking (escrow at-risk, dispute pending)
 *
 * Currently surfaces:
 *   - Leads in `submitted` (need Reserve & View) — capped at 3 newest.
 *   - Leads in `acknowledged` with tracking window <48h — capped at 3.
 *   - Applications in `pending` (need Approve/Reject) — single rollup row.
 *   - Disputed verifications (`disputed_verifying`) — single rollup row.
 */
export async function fetchCompanyActions({ companyId } = {}) {
  await sleep(220);
  if (typeof companyId !== "number") return [];

  const leads = companyLeads(companyId);
  const apps = companyApplications(companyId);
  const out = [];

  // 1. Leads awaiting reservation (submitted, within the 7-day clock).
  const submitted = leads
    .filter((l) => l.status === "submitted" && l.submitted_at)
    .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at));
  for (const lead of submitted.slice(0, 3)) {
    const ackDeadline = new Date(
      new Date(lead.submitted_at).getTime() + 7 * 86_400_000,
    );
    out.push({
      id: `lead-submitted-${lead.id}`,
      type: "lead_submitted",
      severity: "warn",
      title: `New lead — ${lead.client_full_name}`,
      body: "Reserve escrow to reveal contact details and start the tracking window.",
      href: `/leads/${lead.slug}`,
      deadlineISO: ackDeadline.toISOString(),
    });
  }

  // 2. Tracking windows expiring < 48h (lead is in the partner's hands but
  //    company hasn't confirmed sale yet — risk of expiring without action).
  const horizon = new Date(NOW.getTime() + 48 * 3600 * 1000);
  const expiring = leads.filter(
    (l) =>
      l.status === "acknowledged" &&
      l.tracking_window_expires_at &&
      new Date(l.tracking_window_expires_at) <= horizon,
  );
  for (const lead of expiring.slice(0, 3)) {
    out.push({
      id: `lead-expiring-${lead.id}`,
      type: "lead_expiring",
      severity: "warn",
      title: `Tracking window closing — ${lead.client_full_name}`,
      body: "Confirm the sale or mark not converted before the window expires.",
      href: `/leads/${lead.slug}`,
      deadlineISO: lead.tracking_window_expires_at,
    });
  }

  // 3. Pending applications — single rollup. Avoids spamming the stack
  //    when 5 partners apply on the same day.
  const pending = apps.filter((a) => a.status === "pending");
  if (pending.length > 0) {
    out.push({
      id: "applications-pending",
      type: "application_pending",
      severity: "info",
      title:
        pending.length === 1
          ? "1 sales partner waiting for review"
          : `${pending.length} sales partners waiting for review`,
      body: "Approve or reject pending applications to expand your sales reach.",
      href: "/applications",
    });
  }

  // 4. Disputed verifications — informational rollup, ~no action other
  //    than awareness (SellWell drives the verification).
  const disputed = leads.filter((l) =>
    ["disputed_verifying", "expired_verifying"].includes(l.status),
  );
  if (disputed.length > 0) {
    out.push({
      id: "leads-disputed",
      type: "lead_disputed",
      severity: "danger",
      title:
        disputed.length === 1
          ? "1 lead under verification"
          : `${disputed.length} leads under verification`,
      body: "SellWell is contacting the client. No action needed from your side.",
      href: "/leads/inbox?status=disputed_verifying",
    });
  }

  return out;
}

/* ── GET /api/company/commissions-timeseries/?range= ────────────────── */

/**
 * Daily commissions-paid timeseries for the dashboard chart. Same wire
 * shape as the partner-side equivalent — `{ dateISO, current, previous }`
 * arrays. `previous` is the offset-back series so the chart can overlay.
 *
 * For "12m" we bucket by month (same convention as partner side).
 */
export async function fetchCompanyCommissionTimeseries({
  companyId,
  range = "30d",
} = {}) {
  await sleep(260);
  if (typeof companyId === "string") {
    const now = new Date();
    const rangeDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[range] ?? 30;
    const startCurrent = new Date(now.getTime() - rangeDays * 86_400_000);

    const { data: campRows } = await supabase.from("campaigns").select("id").eq("company_id", companyId);
    const campIds = (campRows ?? []).map((c) => c.id);
    if (campIds.length === 0) return Array.from({ length: rangeDays }, (_, i) => ({
      dateISO: new Date(startCurrent.getTime() + i * 86_400_000).toISOString(),
      current: 0, previous: 0,
    }));

    const { data: leads } = await supabase
      .from("leads")
      .select("commission_amount, resolved_at, status")
      .in("campaign_id", campIds)
      .in("status", ["converted", "converted_verified"]);

    const current  = Array.from({ length: rangeDays }, () => 0);
    const previous = Array.from({ length: rangeDays }, () => 0);
    const startPrev = new Date(startCurrent.getTime() - rangeDays * 86_400_000);

    for (const l of leads ?? []) {
      if (!l.resolved_at) continue;
      const t = new Date(l.resolved_at).getTime();
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
  if (typeof companyId !== "number") return [];

  const rangeDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[range] ?? 30;
  const granularity = range === "12m" ? "month" : "day";

  const campaignIds = campaignIdsForCompany(companyId);
  const linkIds = new Set(
    MOCK_PARTNER_LINKS.filter((l) => campaignIds.has(l.campaign)).map((l) => l.id),
  );

  if (granularity === "day") {
    const current = Array.from({ length: rangeDays }, () => 0);
    const previous = Array.from({ length: rangeDays }, () => 0);
    const startCurrent = startOfDay(daysAgo(rangeDays - 1));
    const startPrevious = startOfDay(daysAgo(rangeDays * 2 - 1));

    for (const lead of companyLeads(companyId)) {
      if (!["converted", "converted_verified"].includes(lead.status)) continue;
      if (!lead.resolved_at) continue;
      const t = startOfDay(lead.resolved_at).getTime();
      const idxCur = Math.floor((t - startCurrent.getTime()) / 86_400_000);
      const idxPrev = Math.floor((t - startPrevious.getTime()) / 86_400_000);
      const amount = lead.commission_amount ?? 0;
      if (idxCur >= 0 && idxCur < rangeDays) current[idxCur] += amount;
      if (idxPrev >= 0 && idxPrev < rangeDays) previous[idxPrev] += amount;
    }
    for (const sale of MOCK_PARTNER_LINK_SALES) {
      if (!linkIds.has(sale.partner_link)) continue;
      const t = startOfDay(sale.created_at).getTime();
      const idxCur = Math.floor((t - startCurrent.getTime()) / 86_400_000);
      const idxPrev = Math.floor((t - startPrevious.getTime()) / 86_400_000);
      const amount = sale.commission_amount ?? 0;
      if (idxCur >= 0 && idxCur < rangeDays) current[idxCur] += amount;
      if (idxPrev >= 0 && idxPrev < rangeDays) previous[idxPrev] += amount;
    }

    return current.map((value, i) => ({
      dateISO: new Date(startCurrent.getTime() + i * 86_400_000).toISOString(),
      current: value,
      previous: previous[i],
    }));
  }

  // 12m: bucket by month. 12 months current + 12 months prior overlay.
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const cur = new Date(NOW);
    cur.setMonth(cur.getMonth() - i);
    cur.setDate(1);
    cur.setHours(0, 0, 0, 0);
    const next = new Date(cur);
    next.setMonth(next.getMonth() + 1);
    const prev = new Date(cur);
    prev.setFullYear(prev.getFullYear() - 1);
    const prevNext = new Date(prev);
    prevNext.setMonth(prevNext.getMonth() + 1);

    let current = 0;
    let previous = 0;
    for (const lead of companyLeads(companyId)) {
      if (!["converted", "converted_verified"].includes(lead.status)) continue;
      if (!lead.resolved_at) continue;
      const t = new Date(lead.resolved_at);
      const amount = lead.commission_amount ?? 0;
      if (t >= cur && t < next) current += amount;
      if (t >= prev && t < prevNext) previous += amount;
    }
    for (const sale of MOCK_PARTNER_LINK_SALES) {
      if (!linkIds.has(sale.partner_link)) continue;
      const t = new Date(sale.created_at);
      const amount = sale.commission_amount ?? 0;
      if (t >= cur && t < next) current += amount;
      if (t >= prev && t < prevNext) previous += amount;
    }

    out.push({
      dateISO: cur.toISOString(),
      current,
      previous,
    });
  }
  return out;
}

/* ── GET /api/company/partner-links-performance/ ────────────────────── */

/**
 * Per-campaign rollup of partner-link performance for the company.
 * Returns one row per campaign with `partner_links_enabled=true` owned by
 * this company. Empty array when the company has no partner-link campaigns.
 *
 * Optional `sinceISO` / `untilISO` window the time-bounded fields:
 *   - `revenue`, `commissions_paid`, `conversions` are summed from
 *     `MOCK_PARTNER_LINK_SALES` rows whose `created_at` falls in the window.
 *   - `clicks` stays as the cumulative `total_clicks` because we don't seed
 *     click-by-day data — note that `conversion_rate` becomes apples-to-
 *     oranges in narrow windows and is hidden in those cases by the page.
 * When both bounds are omitted, returns the all-time rollup (same as
 * the original signature, so /dashboard's existing call still works).
 *
 * Wire shape per row:
 *   { campaign_id, campaign_name, slug, clicks, conversions,
 *     conversion_rate, revenue, commissions_paid }
 */
export async function fetchCompanyPartnerLinksPerformance({
  companyId,
  sinceISO,
  untilISO,
} = {}) {
  await sleep(240);
  if (typeof companyId !== "number") return [];

  const campaigns = MOCK_CAMPAIGNS.filter(
    (c) => c.company === companyId && c.partner_links_enabled,
  );
  if (campaigns.length === 0) return [];

  const since = sinceISO ? new Date(sinceISO).getTime() : null;
  const until = untilISO ? new Date(untilISO).getTime() : null;
  const isWindowed = since != null || until != null;
  const inWindow = (s) => {
    const t = new Date(s.created_at).getTime();
    if (since != null && t < since) return false;
    if (until != null && t > until) return false;
    return true;
  };

  return campaigns.map((c) => {
    const links = MOCK_PARTNER_LINKS.filter((l) => l.campaign === c.id);
    const linkIds = new Set(links.map((l) => l.id));
    const allSales = MOCK_PARTNER_LINK_SALES.filter((s) => linkIds.has(s.partner_link));
    const sales = isWindowed ? allSales.filter(inWindow) : allSales;

    const clicks = links.reduce((acc, l) => acc + (l.total_clicks ?? 0), 0);
    const conversions = isWindowed
      ? sales.length
      : links.reduce((acc, l) => acc + (l.total_conversions ?? 0), 0);
    const conversion_rate = clicks
      ? Math.round((conversions / clicks) * 1000) / 10
      : 0;
    const revenue = sales.reduce((acc, s) => acc + (s.sale_amount ?? 0), 0);
    const commissions_paid = sumCommissions(sales);
    return {
      campaign_id: c.id,
      campaign_name: c.product_name,
      slug: c.slug,
      clicks,
      conversions,
      conversion_rate,
      revenue,
      commissions_paid,
    };
  });
}

/* ── GET /api/company/campaigns/:campaignId/partner-link-pulse/ ─────── */

/**
 * Daily pulse for a single campaign — powers the "Daily Pulse" section
 * inside CampaignPartnerBreakdownOverlay. Returns three 14-day daily
 * series + today's value + delta vs the previous 7-day average + the
 * top + quiet day inside the window.
 *
 * Sales rows (`MOCK_PARTNER_LINK_SALES`) are timestamped, so conversions
 * and revenue per day are straightforwardly derivable. **Clicks are
 * the V1 approximation**: `total_clicks` is a running counter on the
 * link, not timestamped. We distribute the campaign's all-time total
 * clicks across the 14-day window proportionally to that window's
 * conversion shape — honest enough to tell the company "Tuesday spiked"
 * and never claims more precision than that. When the real backend
 * adds per-day click buckets, only this function changes.
 *
 * Wire shape:
 *   {
 *     series: { clicks: number[14], conversions: number[14],
 *               conv_rate: number[14] },
 *     today:  { clicks, conversions, conv_rate },
 *     delta_vs_7d_avg: { clicks: %, conversions: %, conv_rate: pp },
 *     top_day:   { date: ISO, clicks, conversions },
 *     quiet_day: { date: ISO, clicks, conversions },
 *   }
 */
export async function fetchCampaignDailyPulse({ campaignId, days = 14 } = {}) {
  await sleep(220);
  if (typeof campaignId !== "number") return null;

  const links = MOCK_PARTNER_LINKS.filter((l) => l.campaign === campaignId);
  if (links.length === 0) return null;
  const linkIds = new Set(links.map((l) => l.id));
  const sales = MOCK_PARTNER_LINK_SALES.filter((s) => linkIds.has(s.partner_link));

  const today = startOfDay(NOW);
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return { date: d, clicks: 0, conversions: 0 };
  });
  const dateIndex = new Map(
    buckets.map((b, i) => [startOfDay(b.date).getTime(), i]),
  );

  // Conversions are real (timestamped sales).
  for (const s of sales) {
    const t = startOfDay(new Date(s.created_at)).getTime();
    const i = dateIndex.get(t);
    if (i != null) buckets[i].conversions += 1;
  }

  // Clicks: distribute total_clicks across the window proportionally
  // to in-window conversions. When there are zero in-window conversions
  // we spread evenly so the chart isn't all zeros (the company DID get
  // clicks even if no sale closed). V1 approximation — see header.
  const totalClicks = links.reduce((acc, l) => acc + (l.total_clicks ?? 0), 0);
  const totalConvInWindow = buckets.reduce((m, b) => m + b.conversions, 0);
  if (totalConvInWindow > 0) {
    let allocated = 0;
    for (let i = 0; i < buckets.length; i++) {
      const share = buckets[i].conversions / totalConvInWindow;
      buckets[i].clicks = Math.round(totalClicks * share);
      allocated += buckets[i].clicks;
    }
    // Sprinkle the rounding remainder onto the most recent day.
    if (allocated !== totalClicks && buckets.length > 0) {
      buckets[buckets.length - 1].clicks += totalClicks - allocated;
    }
  } else if (totalClicks > 0) {
    const each = Math.floor(totalClicks / buckets.length);
    for (let i = 0; i < buckets.length; i++) buckets[i].clicks = each;
    buckets[buckets.length - 1].clicks += totalClicks - each * buckets.length;
  }

  const clickSeries = buckets.map((b) => b.clicks);
  const convSeries = buckets.map((b) => b.conversions);
  const rateSeries = buckets.map((b) =>
    b.clicks > 0 ? Math.round((b.conversions / b.clicks) * 1000) / 10 : 0,
  );

  const todayBucket = buckets[buckets.length - 1];
  const todayValues = {
    clicks: todayBucket.clicks,
    conversions: todayBucket.conversions,
    conv_rate:
      todayBucket.clicks > 0
        ? Math.round((todayBucket.conversions / todayBucket.clicks) * 1000) / 10
        : 0,
  };

  // 7-day average: the 7 days that ENDED yesterday (i.e. exclude today).
  const last7Excl = buckets.slice(-8, -1);
  const avg = (arr, key) => {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((m, b) => m + (b[key] ?? 0), 0);
    return sum / arr.length;
  };
  const baseClicks = avg(last7Excl, "clicks");
  const baseConv = avg(last7Excl, "conversions");
  const baseRate =
    baseClicks > 0
      ? Math.round((baseConv / baseClicks) * 1000) / 10
      : 0;

  const pctDelta = (todayVal, base) =>
    base > 0 ? Math.round(((todayVal - base) / base) * 100) : 0;
  const ppDelta = (todayVal, base) => Math.round((todayVal - base) * 10) / 10;

  // Top + quiet day — by clicks (the most volume-sensitive series).
  let topIdx = 0;
  let quietIdx = 0;
  for (let i = 1; i < buckets.length; i++) {
    if (buckets[i].clicks > buckets[topIdx].clicks) topIdx = i;
    if (buckets[i].clicks < buckets[quietIdx].clicks) quietIdx = i;
  }
  const top = buckets[topIdx];
  const quiet = buckets[quietIdx];

  return {
    series: {
      clicks: clickSeries,
      conversions: convSeries,
      conv_rate: rateSeries,
    },
    today: todayValues,
    delta_vs_7d_avg: {
      clicks: pctDelta(todayValues.clicks, baseClicks),
      conversions: pctDelta(todayValues.conversions, baseConv),
      conv_rate: ppDelta(todayValues.conv_rate, baseRate),
    },
    top_day: {
      date: top.date.toISOString(),
      clicks: top.clicks,
      conversions: top.conversions,
    },
    quiet_day: {
      date: quiet.date.toISOString(),
      clicks: quiet.clicks,
      conversions: quiet.conversions,
    },
  };
}

/* ── GET /api/company/campaigns/:campaignId/partner-link-breakdown/ ─── */

/**
 * Per-partner breakdown for a single campaign — powers the
 * CampaignPartnerBreakdownOverlay opened when a row in the company
 * /partner-links/performance table is clicked.
 *
 * Returns one row per partner who owns a Partner Link on this campaign.
 * Same windowing semantics as `fetchCompanyPartnerLinksPerformance`:
 *   - `revenue`, `commissions_paid`, `conversions` are summed from
 *     in-window `MOCK_PARTNER_LINK_SALES` rows.
 *   - `clicks` is the partner's per-link `total_clicks` (cumulative —
 *     no per-day click seed).
 *
 * Wire shape per row:
 *   { partner_id, partner_name, partner_photo, link_id, link_code,
 *     link_url, clicks, conversions, conversion_rate,
 *     revenue, commissions_paid }
 */
export async function fetchCampaignPartnerLinkBreakdown({
  campaignId,
  sinceISO,
  untilISO,
} = {}) {
  await sleep(220);
  if (typeof campaignId !== "number") return [];

  const since = sinceISO ? new Date(sinceISO).getTime() : null;
  const until = untilISO ? new Date(untilISO).getTime() : null;
  const isWindowed = since != null || until != null;
  const inWindow = (s) => {
    const t = new Date(s.created_at).getTime();
    if (since != null && t < since) return false;
    if (until != null && t > until) return false;
    return true;
  };

  const links = MOCK_PARTNER_LINKS.filter((l) => l.campaign === campaignId);
  return links
    .map((l) => {
      const partner = MOCK_PARTNER_PROFILES.find((p) => p.id === l.sales_partner);
      const allSales = MOCK_PARTNER_LINK_SALES.filter((s) => s.partner_link === l.id);
      const sales = isWindowed ? allSales.filter(inWindow) : allSales;
      const conversions = isWindowed ? sales.length : (l.total_conversions ?? 0);
      const conversion_rate = l.total_clicks
        ? Math.round((conversions / l.total_clicks) * 1000) / 10
        : 0;
      return {
        partner_id: l.sales_partner,
        partner_name: partner ? `${partner.first_name} ${partner.last_name}` : `Partner #${l.sales_partner}`,
        partner_photo: partner?.profile_photo ?? null,
        link_id: l.id,
        link_code: l.code,
        link_url: l.url,
        clicks: l.total_clicks ?? 0,
        conversions,
        conversion_rate,
        revenue: sales.reduce((acc, s) => acc + (s.sale_amount ?? 0), 0),
        commissions_paid: sumCommissions(sales),
      };
    })
    .sort((a, b) => b.commissions_paid - a.commissions_paid); // top performers first
}
