/**
 * Campaigns + Applications layer — Supabase-backed for in-scope fns.
 *
 * IN SCOPE (hit Supabase):
 *   fetchCategories, fetchCampaigns, fetchCompanyCampaigns,
 *   fetchCampaignBySlug, saveCampaignDraft, publishCampaign,
 *   applyToCampaign, fetchPartnerApplications, fetchCompanyApplications,
 *   reviewApplication
 *
 * OUT OF SCOPE (still mock, untouched):
 *   fetchSkillTags, fetchProductTags, fetchPartnerEligibleCampaigns,
 *   fetchApplications, updateCampaign, pauseCampaign, resumeCampaign,
 *   closeCampaign, uploadCampaignDocument, testChargilyWebhook
 */

import { supabase } from "@/lib/supabase";
import { MOCK_CAMPAIGNS } from "./_seed/campaigns";
import { MOCK_APPLICATIONS } from "./_seed/applications";
import { MOCK_CATEGORIES } from "./_seed/categories";
import { MOCK_SKILL_TAGS } from "./_seed/skill-tags";
import { MOCK_PRODUCT_TAGS } from "./_seed/product-tags";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Mock in-memory stores — still used by out-of-scope fns
let _campaigns    = MOCK_CAMPAIGNS.map((c) => ({ ...c }));
let _applications = MOCK_APPLICATIONS.map((a) => ({ ...a }));

/* ── Slug helpers ──────────────────────────────────────────────────────── */

function toSlug(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function uniqueSlug(base) {
  let slug = toSlug(base);
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data } = await supabase
      .from("campaigns")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return slug;
    slug = `${toSlug(base)}-${suffix++}`;
  }
}

function partnerIdForUser(userId) {
  return userId;
}

// fetchCampaigns() → GET /api/campaigns/
export async function fetchCampaigns(filters = {}) {
  let query = supabase
    .from("campaigns")
    .select(`*, category_resolved:categories!campaigns_category_fkey(id,name_en,name_fr,slug)`)
    .order("updated_at", { ascending: false });

  if (filters.companyId) {
    query = query.eq("company_id", filters.companyId);
  }
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    query = query.in("status", statuses);
  }
  if (filters.approvedFor) {
    // Get campaign IDs where partner has an approved application
    const { data: apps } = await supabase
      .from("applications")
      .select("campaign_id")
      .eq("partner_id", filters.approvedFor)
      .eq("status", "approved");
    const ids = (apps ?? []).map((a) => a.campaign_id);
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const rows = data.map((c) => ({
    ...c,
    company: c.company_id, // legacy consumers read campaign.company as the FK
    category_resolved: c.category_resolved ?? null,
  }));

  if (typeof filters.limit === "number") return rows.slice(0, filters.limit);
  return rows;
}

// fetchCompanyCampaigns() → GET /api/campaigns/?owned=1
//
// Company-side campaigns list, enriched with the operational metadata
// the /campaigns page needs without forcing the consumer to do extra
// lookups per row:
//   - active_partners_count : approved CampaignApplications on this campaign
//   - leads_count           : non-draft leads submitted to this campaign
//                              (drafts are private to the partner — never
//                              counted on the company side)
//   - converted_count       : leads in (converted | converted_verified)
//   - conversion_rate       : converted_count / leads_count, 1-decimal pct;
//                              0 when leads_count is 0
//   - category_resolved     : the resolved Category row (en + fr labels)
//
// Filter contract:
//   - companyId  (number, required as session stand-in)
//   - statuses   (CampaignStatus[]) → default all four (active/paused/draft/closed)
//   - search     (string)           → matches product_name (case-insensitive)
//   - sort       ("newest" | "most_leads" | "highest_conversion") default "newest"
//
// Backend swap: GET /api/campaigns/?owned=1 (the `?owned=1` flag tells the
// view to scope by `request.user.company_profile.campaigns`). Wire shape
// returned here is what the backend will mirror.
export async function fetchCompanyCampaigns(filters = {}) {
  const { companyId, statuses, search = "", sort = "newest" } = filters;
  if (!companyId) return [];

  let query = supabase
    .from("campaigns")
    .select(`*, category_resolved:categories!campaigns_category_fkey(id,name_en,name_fr,slug)`)
    .eq("company_id", companyId);

  if (Array.isArray(statuses) && statuses.length > 0) {
    query = query.in("status", statuses);
  }
  const q = search.trim().toLowerCase();
  if (q) {
    query = query.ilike("product_name", `%${q}%`);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // Fetch approved application counts for all these campaigns in one query
  const campaignIds = data.map((c) => c.id);
  let approvedCountMap = new Map();
  if (campaignIds.length > 0) {
    const { data: approvedApps } = await supabase
      .from("applications")
      .select("campaign_id")
      .in("campaign_id", campaignIds)
      .eq("status", "approved");
    for (const a of approvedApps ?? []) {
      approvedCountMap.set(a.campaign_id, (approvedCountMap.get(a.campaign_id) ?? 0) + 1);
    }
  }

  const enriched = data.map((c) => ({
    ...c,
    company: c.company_id,
    category_resolved: c.category_resolved ?? null,
    active_partners_count: approvedCountMap.get(c.id) ?? 0,
    // Leads stay mocked — stub to 0
    leads_count:     0,
    converted_count: 0,
    conversion_rate: 0,
  }));

  if (sort === "most_leads") {
    enriched.sort((a, b) => b.leads_count - a.leads_count);
  } else if (sort === "highest_conversion") {
    enriched.sort((a, b) => b.conversion_rate - a.conversion_rate);
  } else {
    enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return enriched;
}

// fetchCampaignById() → GET /api/campaigns/:id/
export async function fetchCampaignById(id) {
  await sleep(200);
  return _campaigns.find((c) => c.id === id) ?? null;
}

// fetchPartnerEligibleCampaigns() → GET /api/campaigns/?eligible=1
//
// Campaigns the partner can submit a lead for: approved application + campaign active.
export async function fetchPartnerEligibleCampaigns({ userId } = {}) {
  if (!userId) return [];

  // UUID string = real Supabase user
  if (typeof userId === "string") {
    // Get campaign IDs where partner is approved
    const { data: apps } = await supabase
      .from("applications")
      .select("campaign_id")
      .eq("partner_id", userId)
      .eq("status", "approved");
    const ids = (apps ?? []).map((a) => a.campaign_id);
    if (ids.length === 0) return [];

    const { data: campaigns } = await supabase
      .from("campaigns")
      .select(`
        id, slug, product_name, status, commission_type, commission_value,
        tracking_window_days, pricing_tiers,
        company:profiles!campaigns_company_id_fkey(id, company_name, logo)
      `)
      .in("id", ids)
      .eq("status", "active")
      .order("product_name");

    return (campaigns ?? []).map((c) => ({
      id: c.id,
      slug: c.slug,
      product_name: c.product_name,
      status: c.status,
      commission_type: c.commission_type,
      commission_value: c.commission_value,
      tracking_window_days: c.tracking_window_days,
      pricing_tiers: c.pricing_tiers ?? [],
      company: c.company ?? null,
    }));
  }

  // Mock fallback for numeric userId (seed users)
  await sleep(220);
  const partnerId = partnerIdForUser(userId);
  const approvedCampaignIds = new Set(
    _applications
      .filter((a) => a.sales_partner === partnerId && a.status === "approved")
      .map((a) => a.campaign),
  );
  return _campaigns
    .filter((c) => approvedCampaignIds.has(c.id) && c.status === "active")
    .map((c) => {
      const company = MOCK_COMPANY_PROFILES.find((co) => co.id === c.company);
      return {
        id: c.id,
        slug: c.slug,
        product_name: c.product_name,
        status: c.status,
        commission_type: c.commission_type,
        commission_value: c.commission_value,
        tracking_window_days: c.tracking_window_days,
        pricing_tiers: c.pricing_tiers ?? [],
        company: company
          ? { id: company.id, company_name: company.company_name, logo: company.logo }
          : null,
      };
    })
    .sort((a, b) => a.product_name.localeCompare(b.product_name));
}

// createCampaign() → POST /api/campaigns/
export async function createCampaign(payload) { await sleep(450); void payload; return null; }

// updateCampaign() → PATCH /api/campaigns/:id/
//
// Mutates the in-memory `_campaigns` row in place. Returns the updated
// campaign so consumers can patch their React Query caches. Backend
// mirror: serializer accepts a partial Campaign payload and the same
// fields surface back. The page edits patch only the fields the user
// touched, never the full row.
export async function updateCampaign(id, patch) {
  await sleep(350);

  // Upload product_image if it's a File
  const cleanPatch = { ...patch };
  if (patch.product_image instanceof File) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const safe = patch.product_image.name.replace(/[^a-z0-9.\-_]/gi, "_").slice(0, 60);
      const path = `${user.id}/${Date.now()}-${safe}`;
      await supabase.storage.from("avatars").upload(path, patch.product_image, { upsert: true });
      cleanPatch.product_image = supabase.storage.from("avatars").getPublicUrl(path).data?.publicUrl ?? null;
    } else {
      cleanPatch.product_image = null;
    }
  } else if (patch.product_image !== undefined && typeof patch.product_image !== "string") {
    cleanPatch.product_image = null;
  }

  // Try Supabase first (real campaign)
  const { data: sbData, error: sbError } = await supabase
    .from("campaigns")
    .update({ ...cleanPatch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (!sbError && sbData) return sbData;

  // Fallback: mock in-memory
  const idx = _campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ..._campaigns[idx], ...cleanPatch, updated_at: new Date().toISOString() };
  _campaigns[idx] = updated;
  const seedIdx = MOCK_CAMPAIGNS.findIndex((c) => c.id === id);
  if (seedIdx !== -1) MOCK_CAMPAIGNS[seedIdx] = updated;
  return updated;
}

// Status transitions — pause / resume / close. Each mutates the row in
// place and writes the new status back to the underlying seed so the
// listing card / marketplace / dashboard widgets all reflect the change.
async function transitionStatus(id, nextStatus) {
  await sleep(300);
  // Try Supabase first (real campaign)
  const { data: sbData, error: sbError } = await supabase
    .from("campaigns")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (!sbError && sbData) return sbData;

  // Fallback: mock in-memory (seeded dev campaigns)
  const idx = _campaigns.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  const updated = { ..._campaigns[idx], status: nextStatus, updated_at: new Date().toISOString() };
  _campaigns[idx] = updated;
  const seedIdx = MOCK_CAMPAIGNS.findIndex((c) => c.id === id);
  if (seedIdx !== -1) MOCK_CAMPAIGNS[seedIdx] = updated;
  return updated;
}

// pauseCampaign() → PATCH /api/campaigns/:id/ { status: 'paused' }
export async function pauseCampaign(id)  { return transitionStatus(id, "paused"); }
// resumeCampaign() → PATCH /api/campaigns/:id/ { status: 'active' }
export async function resumeCampaign(id) { return transitionStatus(id, "active"); }
// closeCampaign() → PATCH /api/campaigns/:id/ { status: 'closed' }
export async function closeCampaign(id)  { return transitionStatus(id, "closed"); }

// fetchCampaignBySlug() → GET /api/campaigns/by-slug/:slug/
export async function fetchCampaignBySlug(slug, { companyId } = {}) {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(`
      *,
      category_resolved:categories!campaigns_category_fkey(id,name_en,name_fr,slug),
      company:profiles!campaigns_company_id_fkey(id,company_name,logo,industry)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !campaign) return null;

  // Scope check: if companyId passed and doesn't match, 404 not a data leak
  if (companyId && campaign.company_id !== companyId) return null;

  // Fetch recent applications (pending-first, cap 5) with partner profile slice
  const { data: appsRaw } = await supabase
    .from("applications")
    .select(`
      id, pitch, status, applied_at, reviewed_at,
      partner:profiles!applications_partner_id_fkey(id,first_name,last_name,profile_photo)
    `)
    .eq("campaign_id", campaign.id)
    .order("applied_at", { ascending: true })
    .limit(20);

  const allApps = appsRaw ?? [];
  const recent_applications = allApps
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return new Date(a.applied_at) - new Date(b.applied_at);
    })
    .slice(0, 5);

  const active_partners_count = allApps.filter((a) => a.status === "approved").length;
  const companyProfile = campaign.company;

  return {
    ...campaign,
    company: companyProfile
      ? {
          id:           companyProfile.id,
          user:         companyProfile.id,
          company_name: companyProfile.company_name,
          logo:         companyProfile.logo,
          industry:     companyProfile.industry,
        }
      : null,
    category_resolved:    campaign.category_resolved ?? null,
    active_partners_count,
    leads_count:      0,
    converted_count:  0,
    conversion_rate:  0,
    revenue_total:    0,
    commissions_paid: 0,
    documents:        [],
    recent_applications,
    recent_leads:     [],
  };
}

// fetchApplications() → GET /api/applications/
export async function fetchApplications(filters = {}) {
  await sleep(250);
  let rows = _applications;

  if (typeof filters.userId === "number") {
    const partnerId = partnerIdForUser(filters.userId);
    rows = rows.filter((a) => a.sales_partner === partnerId);
  }
  if (typeof filters.companyId === "number") {
    const companyCampaignIds = new Set(
      _campaigns.filter((c) => c.company === filters.companyId).map((c) => c.id),
    );
    rows = rows.filter((a) => companyCampaignIds.has(a.campaign));
  }
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    rows = rows.filter((a) => statuses.includes(a.status));
  }

  rows = [...rows].sort(
    (a, b) => new Date(b.applied_at) - new Date(a.applied_at),
  );
  if (typeof filters.limit === "number") rows = rows.slice(0, filters.limit);
  return rows;
}

// fetchPartnerApplications() → GET /api/applications/
//
// Partner-side applications list, enriched with the nested campaign +
// company slice so the /applications page renders without a second
// fetch per row. The future Django endpoint will mirror this contract:
// the partner is identified from the session (request.user) — the
// client never sends partner_id. The optional `userId` arg here is
// purely a stand-in for that session so the mock layer stays callable.
//
// Wire shape per row:
//   id, pitch, status, applied_at, reviewed_at,
//   campaign: { id, slug, product_name, category, commission_type,
//               commission_value, tracking_window_days,
//               partner_links_enabled, status,
//               company: { id, company_name, logo, industry },
//               category_resolved: Category }
//
// Filter contract:
//   - userId   (number)               → required (session stand-in)
//   - status   (ApplicationStatus | ApplicationStatus[])
//   - search   (string)               → matches campaign.product_name OR
//                                        company.company_name (case-insensitive)
export async function fetchPartnerApplications(filters = {}) {
  const { userId, status, search } = filters;
  if (!userId) return [];

  let query = supabase
    .from("applications")
    .select(`
      id, pitch, status, applied_at, reviewed_at,
      campaign:campaigns!applications_campaign_id_fkey(
        id, slug, product_name, category, commission_type, commission_value,
        tracking_window_days, partner_links_enabled, status,
        category_resolved:categories!campaigns_category_fkey(id,name_en,name_fr,slug),
        company:profiles!campaigns_company_id_fkey(id,company_name,logo,industry)
      )
    `)
    .eq("partner_id", userId)
    .order("applied_at", { ascending: false });

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let rows = data.map((a) => ({
    ...a,
    campaign: a.campaign
      ? {
          ...a.campaign,
          company:          a.campaign.company ?? null,
          category_resolved: a.campaign.category_resolved ?? null,
        }
      : null,
  }));

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    rows = rows.filter((r) => {
      const product     = (r.campaign?.product_name ?? "").toLowerCase();
      const companyName = (r.campaign?.company?.company_name ?? "").toLowerCase();
      return product.includes(q) || companyName.includes(q);
    });
  }

  return rows;
}

// fetchCompanyApplications() → GET /api/applications/
//
// Company-side applications list, enriched with the nested partner profile
// + campaign slice so the company dashboard + /applications page render
// without a second fetch per row. Future Django endpoint mirrors this:
// the company is identified from the session — the client never sends
// company_id. The optional `companyId` arg here is the session stand-in.
//
// Wire shape per row:
//   id, pitch, status, applied_at, reviewed_at,
//   partner: { id, first_name, last_name, profile_photo, bio, linkedin_url,
//              categories, skill_tags },
//   campaign: { id, slug, product_name, status, commission_type,
//               commission_value }
//
// Filter contract:
//   - companyId (number, required as session stand-in)
//   - status    (ApplicationStatus | ApplicationStatus[])
//   - limit     (number) — for the dashboard preview
export async function fetchCompanyApplications(filters = {}) {
  const { companyId, status, limit } = filters;
  if (!companyId) return [];

  let query = supabase
    .from("applications")
    .select(`
      id, pitch, status, applied_at, reviewed_at, review_reason,
      partner:profiles!applications_partner_id_fkey(
        id, first_name, last_name, profile_photo, phone, bio,
        linkedin_url, cv_file, categories, skill_tags
      ),
      campaign:campaigns!applications_campaign_id_fkey(
        id, slug, product_name, status, commission_type, commission_value,
        company_id
      )
    `)
    .order("applied_at", { ascending: true });

  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  // Filter to applications on campaigns owned by this company
  let rows = data.filter((a) => a.campaign?.company_id === companyId);

  // Pending first, then newest-first
  rows.sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    if (a.status === "pending" && b.status === "pending") {
      return new Date(a.applied_at) - new Date(b.applied_at);
    }
    return new Date(b.applied_at) - new Date(a.applied_at);
  });

  if (typeof limit === "number") rows = rows.slice(0, limit);
  return rows;
}

// applyToCampaign() → POST /api/applications/
//
// Creates a new CampaignApplication for `partnerId` (defaulting to the
// current viewer; the backend will pull this from the session). Mutates
// MOCK_APPLICATIONS in place so subsequent fetches reflect the new row.
// If the partner already has any application on this campaign (any status),
// the call is rejected — the backend enforces the same `unique_together`.
export async function applyToCampaign({ campaign_id, partner_id, pitch }) {
  const { data, error } = await supabase
    .from("applications")
    .insert({ campaign_id, partner_id, pitch, status: "pending" })
    .select()
    .single();

  if (error) {
    // Postgres unique violation → already applied
    if (error.code === "23505") {
      const err = new Error("already_applied");
      err.code = "already_applied";
      throw err;
    }
    throw error;
  }

  return data;
}
// reviewApplication() → POST /api/applications/:id/review/
//
// Approves or rejects a CampaignApplication. Mutates `_applications` and
// writes back to MOCK_APPLICATIONS so the partner-side surfaces (their
// own /applications, marketplace `partner_application_status`) reflect
// the decision immediately. Stamps `reviewed_at` so the partner-side
// re-application cooldown countdown is correct from this moment.
//
// `reason` is required when `decision === 'reject'`; persisted to a
// `review_reason` field for parity with the future Django serializer
// (Django will use the same name).
export async function reviewApplication(id, { decision, reason } = {}) {
  const status = decision === "approve" ? "approved" : "rejected";

  const { data, error } = await supabase
    .from("applications")
    .update({
      status,
      reviewed_at:   new Date().toISOString(),
      review_reason: status === "rejected" ? (reason ?? null) : null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
}

// fetchCategories() → GET /api/categories/ — live from Supabase
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("id");
  if (error || !data) return MOCK_CATEGORIES.filter((c) => c.is_active); // fallback
  return data;
}
export async function fetchSkillTags()  { await sleep(150); return MOCK_SKILL_TAGS.filter((t) => t.is_active); }
export async function fetchProductTags(){ await sleep(150); return MOCK_PRODUCT_TAGS.filter((t) => t.is_active); }

// saveCampaignDraft() → POST /api/campaigns/ (status='draft')
export async function saveCampaignDraft(payload) {
  const slug = await uniqueSlug(payload.product_name ?? "campaign");
  let companyId = payload.company_id ?? payload.companyId ?? null;
  if (!companyId) {
    const { data: { user } } = await supabase.auth.getUser();
    companyId = user?.id ?? null;
  }
  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      company_id:           companyId,
      product_name:         payload.product_name,
      slug,
      description:          payload.description ?? "",
      product_image:        typeof payload.product_image === "string" ? payload.product_image : null,
      category:             payload.category ?? null,
      product_tags:         payload.product_tags ?? [],
      target_industries:    payload.target_industries ?? [],
      target_company_size:  payload.target_company_size ?? [],
      target_description:   payload.target_description ?? null,
      requirements:         payload.requirements ?? null,
      commission_type:      payload.commission_type ?? "percentage",
      commission_value:     payload.commission_value ?? 0,
      tracking_window_days: payload.tracking_window_days ?? 30,
      partner_links_enabled: payload.partner_links_enabled ?? false,
      merchant_redirect_url: payload.merchant_redirect_url ?? null,
      pricing_tiers:        payload.pricing_tiers ?? [],
      status:               "draft",
    })
    .select()
    .single();

  if (error) return { id: null, status: "draft", error: error.message };
  return data;
}

// publishCampaign() → POST /api/campaigns/ with status='active'
export async function publishCampaign(payload) {
  // If a draft id is passed, promote it; otherwise insert fresh
  if (payload.id) {
    const { data, error } = await supabase
      .from("campaigns")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", payload.id)
      .select()
      .single();
    if (error) return { id: payload.id, status: "draft", error: error.message };
    return data;
  }

  const slug = await uniqueSlug(payload.product_name ?? "campaign");
  // Fallback: read uid from live Supabase session if payload didn't carry it
  let companyId = payload.company_id ?? payload.companyId ?? null;
  if (!companyId) {
    const { data: { user } } = await supabase.auth.getUser();
    companyId = user?.id ?? null;
  }

  // Upload product_image if it's a File object
  let productImageUrl = typeof payload.product_image === "string" ? payload.product_image : null;
  if (payload.product_image instanceof File && companyId) {
    const safe = payload.product_image.name.replace(/[^a-z0-9.\-_]/gi, "_").slice(0, 60);
    const path = `${companyId}/${Date.now()}-${safe}`;
    await supabase.storage.from("avatars").upload(path, payload.product_image, { upsert: true });
    productImageUrl = supabase.storage.from("avatars").getPublicUrl(path).data?.publicUrl ?? null;
  }

  const insertRow = {
    company_id:           companyId,
    product_name:         payload.product_name,
    slug,
    description:          payload.description ?? "",
    product_image:        productImageUrl,
    category:             payload.category ?? null,
    product_tags:         payload.product_tags ?? [],
    target_industries:    payload.target_industries ?? [],
    target_company_size:  payload.target_company_size ?? [],
    target_description:   payload.target_description ?? null,
    requirements:         payload.requirements ?? null,
    commission_type:      payload.commission_type ?? "percentage",
    commission_value:     payload.commission_value ?? 0,
    tracking_window_days: payload.tracking_window_days ?? 30,
    partner_links_enabled: payload.partner_links_enabled ?? false,
    merchant_redirect_url: payload.merchant_redirect_url ?? null,
    pricing_tiers:        payload.pricing_tiers ?? [],
    status:               "active",
  };
  const { data, error } = await supabase
    .from("campaigns")
    .insert(insertRow)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// uploadCampaignDocument() → POST /api/campaigns/:id/documents/
export async function uploadCampaignDocument({ campaign_id, slot, file, url, label, sort_order }) {
  await sleep(300);
  void campaign_id; void slot; void file; void url; void label; void sort_order;
  return { id: Math.floor(Math.random() * 10000) };
}

// testChargilyWebhook() → POST /api/campaigns/:id/test-webhook/
// Mock: always succeeds after a realistic delay.
export async function testChargilyWebhook(campaignId) {
  await sleep(1200);
  void campaignId;
  return { ok: true };
}
