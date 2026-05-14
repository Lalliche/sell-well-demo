/**
 * Leads layer — Supabase-backed for partner-facing functions.
 *
 * IN SCOPE (Supabase):
 *   fetchPartnerLeads, createLead, submitLead,
 *   fetchLeadNotes, addLeadNote
 *
 * OUT OF SCOPE (still mock — company-side, escrow, confirm/deny):
 *   fetchCompanyLeads, acknowledgeLead, confirmSale, denyConversion,
 *   fetchLeadDocuments, addLeadDocument, removeLeadDocument
 */

import { supabase } from "@/lib/supabase";
import { MOCK_LEADS, MOCK_LEAD_NOTES, MOCK_LEAD_DOCUMENTS } from "./_seed/leads";
import { MOCK_CAMPAIGNS } from "./_seed/campaigns";
import { MOCK_COMPANY_PROFILES } from "./_seed/company-profiles";
import { MOCK_CATEGORIES } from "./_seed/categories";
import { getPlatformSetting } from "./admin";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Mutable per-process copies so future mock mutations (acknowledge, confirm,
 * deny, addNote, submit, addDocument, removeDocument) persist across calls
 * during a session. */
let _leads = MOCK_LEADS.map((l) => ({ ...l }));
let _notes = MOCK_LEAD_NOTES.map((n) => ({ ...n }));
let _documents = MOCK_LEAD_DOCUMENTS.map((d) => ({ ...d }));

/** Sort key — drafts have no submitted_at, so fall back to created_at. */
function sortKey(lead) {
  return new Date(lead.submitted_at ?? lead.created_at).getTime();
}

/** Resolve User.id → SalesPartnerProfile.id pass-through. In the seed,
 *  `sales_partner` on Lead is the SalesPartnerProfile id, which == User.id
 *  for partner mock users (1:1 mapping in the seed). Real backend will
 *  do a proper join. */
function partnerIdForUser(userId) {
  return userId;
}

/** Resolve `companyId` → list of campaign ids that belong to that company. */
function campaignsForCompany(companyId) {
  return MOCK_CAMPAIGNS.filter((c) => c.company === companyId).map((c) => c.id);
}

// fetchLeads() → used by partner dashboard (simple list, no enrichment)
export async function fetchLeads(filters = {}) {
  // UUID string = real Supabase user
  if (typeof filters.userId === "string") {
    let query = supabase
      .from("leads")
      .select("*")
      .eq("partner_id", filters.userId)
      .order("created_at", { ascending: false });
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      query = query.in("status", statuses);
    }
    if (typeof filters.limit === "number") query = query.limit(filters.limit);
    const { data } = await query;
    return data ?? [];
  }
  // Mock fallback for numeric userId (seed users)
  if (typeof filters.companyId === "string") return [];
  await sleep(280);
  let rows = _leads;
  if (typeof filters.userId === "number") {
    rows = rows.filter((l) => l.sales_partner === filters.userId);
  }
  if (typeof filters.companyId === "number") {
    const campaignIds = campaignsForCompany(filters.companyId);
    rows = rows.filter((l) => campaignIds.includes(l.campaign) && l.status !== "draft");
  }
  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    rows = rows.filter((l) => statuses.includes(l.status));
  }
  rows = [...rows].sort((a, b) => sortKey(b) - sortKey(a));
  if (typeof filters.limit === "number") rows = rows.slice(0, filters.limit);
  return rows;
}

// fetchPartnerLeads() → GET /api/leads/
//
// Partner-side leads list enriched with campaign + company + notes.
// Wire shape per row:
//   campaign: { id, slug, product_name, commission_type, commission_value,
//               tracking_window_days, tier_count, status,
//               company: { id, company_name, logo, industry },
//               category_resolved: Category }
//   pricing_tier_resolved: { name, price } | null
//   notes: LeadNote[]
//   documents: []
export async function fetchPartnerLeads(filters = {}) {
  const { userId, status, search } = filters;
  if (!userId) return [];

  // UUID string = real Supabase user
  if (typeof userId === "string") {
    let query = supabase
      .from("leads")
      .select(`
        *,
        campaign:campaigns!leads_campaign_id_fkey(
          id, slug, product_name, commission_type, commission_value,
          tracking_window_days, status, pricing_tiers,
          company:profiles!campaigns_company_id_fkey(id, company_name, logo, industry),
          category_resolved:categories!campaigns_category_fkey(id, name_en, name_fr, slug)
        ),
        notes:lead_notes(id, body, author, created_at)
      `)
      .eq("partner_id", userId)
      .order("created_at", { ascending: false });

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in("status", statuses);
    }
    if (search?.trim()) {
      query = query.ilike("client_full_name", `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const ackWindowDays = 7;
    return data.map((l) => {
      const camp = l.campaign ?? null;
      const tiers = camp?.pricing_tiers ?? [];
      return {
        ...l,
        // Coerce Supabase numeric strings → JS numbers
        commission_amount:   Number(l.commission_amount   ?? 0),
        platform_fee_amount: Number(l.platform_fee_amount ?? 0),
        total_reservation:   Number(l.total_reservation   ?? 0),
        ack_deadline:
          l.status === "submitted" && l.submitted_at
            ? new Date(new Date(l.submitted_at).getTime() + ackWindowDays * 86_400_000).toISOString()
            : null,
        campaign: camp
          ? {
              id: camp.id,
              slug: camp.slug,
              product_name: camp.product_name,
              commission_type: camp.commission_type,
              commission_value: Number(camp.commission_value ?? 0),
              tracking_window_days: camp.tracking_window_days,
              tier_count: tiers.length,
              status: camp.status,
              company: camp.company ?? null,
              category_resolved: camp.category_resolved ?? null,
            }
          : null,
        // Pricing tier stored as name+price directly on the lead row
        pricing_tier_resolved:
          l.pricing_tier_name
            ? { name: l.pricing_tier_name, price: Number(l.pricing_tier_price ?? 0) }
            : null,
        notes: (l.notes ?? []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        documents: [],
      };
    });
  }

  // Mock fallback for numeric userId (seed users)
  await sleep(260);
  if (typeof userId !== "number") return [];

  let rows = _leads.filter((l) => l.sales_partner === userId);
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    rows = rows.filter((l) => statuses.includes(l.status));
  }
  const ackWindowDays = getPlatformSetting("lead_acknowledgment_window_days", 7);
  const enriched = rows.map((l) => {
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === l.campaign);
    if (!campaign) return null;
    const company = MOCK_COMPANY_PROFILES.find((co) => co.id === campaign.company);
    const category = MOCK_CATEGORIES.find((cat) => cat.id === campaign.category);
    const tier = (campaign.pricing_tiers ?? []).find((t) => t.id === l.pricing_tier);
    const notes = _notes.filter((n) => n.lead === l.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const documents = _documents.filter((d) => d.lead === l.id);
    return {
      ...l,
      ack_deadline: l.status === "submitted" && l.submitted_at
        ? new Date(new Date(l.submitted_at).getTime() + ackWindowDays * 86_400_000).toISOString()
        : null,
      campaign: {
        id: campaign.id, slug: campaign.slug, product_name: campaign.product_name,
        category: campaign.category, commission_type: campaign.commission_type,
        commission_value: campaign.commission_value,
        tracking_window_days: campaign.tracking_window_days,
        tier_count: (campaign.pricing_tiers ?? []).length,
        status: campaign.status,
        company: company ? { id: company.id, company_name: company.company_name, logo: company.logo, industry: company.industry } : null,
        category_resolved: category ?? null,
      },
      pricing_tier_resolved: tier ? { id: tier.id, name: tier.name, price: tier.price } : null,
      notes,
      documents,
    };
  }).filter(Boolean);

  let filtered = enriched;
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = enriched.filter((row) => {
      const client = (row.client_full_name ?? "").toLowerCase();
      const company = (row.client_company_name ?? "").toLowerCase();
      const product = (row.campaign?.product_name ?? "").toLowerCase();
      return client.includes(q) || company.includes(q) || product.includes(q);
    });
  }
  filtered.sort((a, b) => sortKey(b) - sortKey(a));
  return filtered;
}

// fetchCompanyLeads() → GET /api/leads/?role=company
//
// Company-side leads inbox. Drafts excluded. Contact masked pre-reservation.
export async function fetchCompanyLeads(filters = {}) {
  const { companyId, status, search } = filters;
  if (!companyId) return [];

  // UUID string = real Supabase company
  if (typeof companyId === "string") {
    // Get all campaign IDs owned by this company
    const { data: campRows } = await supabase
      .from("campaigns")
      .select("id")
      .eq("company_id", companyId);
    const campIds = (campRows ?? []).map((c) => c.id);
    if (campIds.length === 0) return [];

    let query = supabase
      .from("leads")
      .select(`
        *,
        campaign:campaigns!leads_campaign_id_fkey(
          id, slug, product_name, status, commission_type, commission_value,
          tracking_window_days, pricing_tiers,
          category_resolved:categories!campaigns_category_fkey(id, name_en, name_fr, slug)
        ),
        partner:profiles!leads_partner_id_fkey(
          id, first_name, last_name, profile_photo
        ),
        notes:lead_notes(id, body, author, created_at)
      `)
      .in("campaign_id", campIds)
      .neq("status", "draft")
      .order("submitted_at", { ascending: false, nullsFirst: false });

    if (status) {
      const statuses = Array.isArray(status) ? status : [status];
      query = query.in("status", statuses);
    }
    if (search?.trim()) {
      query = query.ilike("client_full_name", `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error || !data) return [];

    const HIDDEN = new Set(["submitted", "pending_escrow"]);
    const ackWindowDays = 7;

    return data.map((l) => {
      const isHidden = HIDDEN.has(l.status);
      const camp = l.campaign ?? null;
      const tiers = camp?.pricing_tiers ?? [];
      return {
        ...l,
        commission_amount:   Number(l.commission_amount   ?? 0),
        platform_fee_amount: Number(l.platform_fee_amount ?? 0),
        total_reservation:   Number(l.total_reservation   ?? 0),
        contact_revealed: !isHidden,
        client_full_name:    isHidden ? null : l.client_full_name,
        client_company_name: isHidden ? null : l.client_company_name,
        client_phone:        isHidden ? null : l.client_phone,
        client_email:        isHidden ? null : l.client_email,
        ack_deadline:
          l.status === "submitted" && l.submitted_at
            ? new Date(new Date(l.submitted_at).getTime() + ackWindowDays * 86_400_000).toISOString()
            : null,
        campaign: camp
          ? {
              id: camp.id,
              slug: camp.slug,
              product_name: camp.product_name,
              status: camp.status,
              tracking_window_days: camp.tracking_window_days,
              commission_type: camp.commission_type,
              commission_value: Number(camp.commission_value ?? 0),
              tier_count: tiers.length,
              category_resolved: camp.category_resolved ?? null,
            }
          : null,
        pricing_tier_resolved:
          l.pricing_tier_name
            ? { name: l.pricing_tier_name, price: Number(l.pricing_tier_price ?? 0) }
            : null,
        partner: l.partner ?? null,
        notes: isHidden
          ? []
          : (l.notes ?? []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        documents: [],
      };
    });
  }

  // Mock fallback for numeric companyId (seed users)
  await sleep(280);
  if (typeof companyId !== "number") return [];

  const companyCampaignIds = new Set(
    MOCK_CAMPAIGNS.filter((c) => c.company === companyId).map((c) => c.id),
  );
  let rows = _leads.filter(
    (l) => companyCampaignIds.has(l.campaign) && l.status !== "draft",
  );
  if (status) {
    const statuses = Array.isArray(status) ? status : [status];
    rows = rows.filter((l) => statuses.includes(l.status));
  }
  const HIDDEN = new Set(["submitted", "pending_escrow"]);
  const { MOCK_PARTNER_PROFILES } = await import("./_seed/partner-profiles");
  const ackWindowDays = getPlatformSetting("lead_acknowledgment_window_days", 7);
  const enriched = rows.map((l) => {
    const campaign = MOCK_CAMPAIGNS.find((c) => c.id === l.campaign);
    if (!campaign) return null;
    const tier = (campaign.pricing_tiers ?? []).find((t) => t.id === l.pricing_tier);
    const partner = MOCK_PARTNER_PROFILES.find((p) => p.id === l.sales_partner);
    const category = MOCK_CATEGORIES.find((cat) => cat.id === campaign.category);
    const isHidden = HIDDEN.has(l.status);
    const notes = _notes.filter((n) => n.lead === l.id).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    const documents = _documents.filter((d) => d.lead === l.id);
    return {
      ...l,
      ack_deadline: l.status === "submitted" && l.submitted_at
        ? new Date(new Date(l.submitted_at).getTime() + ackWindowDays * 86_400_000).toISOString()
        : null,
      client_full_name: isHidden ? null : l.client_full_name,
      client_company_name: isHidden ? null : l.client_company_name,
      client_phone: isHidden ? null : l.client_phone,
      client_email: isHidden ? null : l.client_email,
      contact_revealed: !isHidden,
      campaign: {
        id: campaign.id, slug: campaign.slug, product_name: campaign.product_name,
        status: campaign.status, tracking_window_days: campaign.tracking_window_days,
        commission_type: campaign.commission_type, commission_value: campaign.commission_value,
        tier_count: (campaign.pricing_tiers ?? []).length, category_resolved: category ?? null,
      },
      pricing_tier_resolved: tier ? { id: tier.id, name: tier.name, price: tier.price } : null,
      partner: partner ? { id: partner.id, first_name: partner.first_name, last_name: partner.last_name, profile_photo: partner.profile_photo } : null,
      notes: isHidden ? [] : notes,
      documents: isHidden ? [] : documents,
    };
  }).filter(Boolean);
  if (typeof search === "string" && search.trim()) {
    const q = search.trim().toLowerCase();
    return enriched.filter((row) => {
      const pName = row.partner ? `${row.partner.first_name} ${row.partner.last_name}`.toLowerCase() : "";
      const client = (row.client_full_name ?? "").toLowerCase();
      const product = (row.campaign?.product_name ?? "").toLowerCase();
      return pName.includes(q) || client.includes(q) || product.includes(q);
    });
  }
  return enriched.sort((a, b) => new Date(b.submitted_at ?? b.created_at) - new Date(a.submitted_at ?? a.created_at));
}

// createLead() → POST /api/leads/
//
// Saves the row as status='draft'. Computes commission + platform fee.
// For real Supabase users: inserts into the leads table + optionally
// inserts the first LeadNote row.
export async function createLead(payload) {
  const {
    campaign_id,
    partner_id,
    pricing_tier_id,
    client_full_name,
    client_company_name,
    client_phone,
    client_email,
    first_note,
  } = payload ?? {};

  // UUID partner = real Supabase user
  if (typeof partner_id === "string") {
    // Fetch campaign to compute commission
    const { data: campaign, error: campErr } = await supabase
      .from("campaigns")
      .select("commission_type, commission_value, pricing_tiers")
      .eq("id", campaign_id)
      .single();
    if (campErr || !campaign) {
      const err = new Error("campaign_not_found");
      err.code = "campaign_not_found";
      throw err;
    }

    // Resolve pricing tier from campaign's JSON array
    const tiers = campaign.pricing_tiers ?? [];
    const tier = tiers.find((t) => t.id === pricing_tier_id) ?? tiers[0] ?? null;
    const tierPrice = tier?.price ?? 0;
    const tierName  = tier?.name  ?? "Standard";

    const platformFeePct = 10; // hardcoded for demo
    const commission_amount =
      campaign.commission_type === "percentage"
        ? Math.round(tierPrice * (Number(campaign.commission_value) / 100))
        : Number(campaign.commission_value);
    const platform_fee_amount = Math.round(tierPrice * (platformFeePct / 100));
    const total_reservation = commission_amount + platform_fee_amount;

    // Slug: {name-slug}-{3-char suffix}
    const slugBase = (client_full_name ?? "lead")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const suffix = Math.random().toString(36).slice(2, 5);
    const slug = `${slugBase}-${suffix}`;

    const { data: row, error } = await supabase
      .from("leads")
      .insert({
        slug,
        campaign_id,
        partner_id,
        pricing_tier_name: tierName,
        pricing_tier_price: tierPrice,
        client_full_name,
        client_company_name: client_company_name || null,
        client_phone,
        client_email: client_email || null,
        status: "draft",
        commission_amount,
        platform_fee_amount,
        total_reservation,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Coerce numeric strings from Supabase
    row.commission_amount   = Number(row.commission_amount   ?? 0);
    row.platform_fee_amount = Number(row.platform_fee_amount ?? 0);
    row.total_reservation   = Number(row.total_reservation   ?? 0);

    // Append the first note if provided
    if (typeof first_note === "string" && first_note.trim()) {
      await supabase.from("lead_notes").insert({
        lead_id: row.id,
        body: first_note.trim(),
        author: "partner",
      });
    }

    return row;
  }

  // Mock fallback for numeric partner_id (seed users)
  await sleep(450);
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === campaign_id);
  if (!campaign) { const e = new Error("campaign_not_found"); e.code = "campaign_not_found"; throw e; }
  const tier = (campaign.pricing_tiers ?? []).find((t) => t.id === pricing_tier_id);
  if (!tier) { const e = new Error("tier_not_found"); e.code = "tier_not_found"; throw e; }
  const platformFeePct = getPlatformSetting("platform_fee_percentage", 10);
  const commission_amount = campaign.commission_type === "percentage"
    ? Math.round(tier.price * (Number(campaign.commission_value) / 100))
    : Number(campaign.commission_value);
  const platform_fee_amount = Math.round(tier.price * (platformFeePct / 100));
  const total_reservation = commission_amount + platform_fee_amount;
  const slugBase = (client_full_name ?? "lead").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${slugBase}-${Math.random().toString(36).slice(2, 5)}`;
  const nowIso = new Date().toISOString();
  const nextId = MOCK_LEADS.reduce((m, l) => Math.max(m, l.id), 0) + 1;
  const row = {
    id: nextId, slug, campaign: campaign_id, sales_partner: partner_id,
    pricing_tier: pricing_tier_id, client_full_name,
    client_company_name: client_company_name || null, client_phone,
    client_email: client_email || null, status: "draft",
    commission_amount, platform_fee_amount, total_reservation,
    actual_sale_amount: null, acknowledged_at: null, tracking_window_expires_at: null,
    submitted_at: null, created_at: nowIso, resolved_at: null, denial_reason: null,
  };
  MOCK_LEADS.push(row); _leads.push(row);
  if (typeof first_note === "string" && first_note.trim()) {
    const noteId = (_notes.reduce((m, n) => Math.max(m, n.id), 0) || 0) + 1;
    const note = { id: noteId, lead: row.id, body: first_note.trim(), created_at: nowIso };
    MOCK_LEAD_NOTES.push(note); _notes.push(note);
  }
  return row;
}

// submitLead() → POST /api/leads/:id/submit/
// Flips a draft to `submitted` and stamps `submitted_at`.
export async function submitLead(id) {
  // UUID string id = real Supabase lead
  if (typeof id === "string") {
    const { data: lead } = await supabase.from("leads").select("status").eq("id", id).single();
    if (!lead) { const e = new Error("lead_not_found"); e.code = "lead_not_found"; throw e; }
    if (lead.status !== "draft") { const e = new Error("not_draft"); e.code = "not_draft"; throw e; }
    const { data: updated, error } = await supabase
      .from("leads")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated;
  }

  // Mock fallback for numeric id (seed users)
  await sleep(350);
  const idx = _leads.findIndex((l) => l.id === id);
  if (idx === -1) { const e = new Error("lead_not_found"); e.code = "lead_not_found"; throw e; }
  const lead = _leads[idx];
  if (lead.status !== "draft") { const e = new Error("not_draft"); e.code = "not_draft"; throw e; }
  const updated = { ...lead, status: "submitted", submitted_at: new Date().toISOString() };
  _leads[idx] = updated;
  const seedIdx = MOCK_LEADS.findIndex((l) => l.id === id);
  if (seedIdx !== -1) MOCK_LEADS[seedIdx] = updated;
  return updated;
}

// fetchLeadNotes() → GET /api/leads/:id/notes/
export async function fetchLeadNotes(leadId) {
  if (typeof leadId === "string") {
    const { data } = await supabase
      .from("lead_notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });
    return data ?? [];
  }
  await sleep(180);
  return _notes.filter((n) => n.lead === leadId)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

// addLeadNote() → POST /api/leads/:id/notes/
export async function addLeadNote({ lead_id, body, created_at, author = "partner" }) {
  const trimmed = (body ?? "").trim();
  if (!trimmed) { const e = new Error("empty_body"); e.code = "empty_body"; throw e; }

  if (typeof lead_id === "string") {
    const { data, error } = await supabase
      .from("lead_notes")
      .insert({ lead_id, body: trimmed, author, ...(created_at ? { created_at } : {}) })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  await sleep(280);
  const lead = _leads.find((l) => l.id === lead_id);
  if (!lead) { const e = new Error("lead_not_found"); e.code = "lead_not_found"; throw e; }
  const noteId = (_notes.reduce((m, n) => Math.max(m, n.id), 0) || 0) + 1;
  const note = { id: noteId, lead: lead_id, body: trimmed, author, created_at: created_at || new Date().toISOString() };
  MOCK_LEAD_NOTES.push(note); _notes.push(note);
  return note;
}

// addCompanyLeadNote() → thin convenience wrapper that posts a note as
// the company. Backend will pick the author from `request.user.role`;
// the frontend passes it explicitly here to keep the mock honest.
export async function addCompanyLeadNote({ lead_id, body }) {
  return addLeadNote({ lead_id, body, author: "company" });
}

// fetchLeadById() → GET /api/leads/:id/
export async function fetchLeadById(id) {
  await sleep(200);
  return _leads.find((l) => l.id === id) ?? null;
}

// fetchLeadDocuments() → GET /api/leads/:id/documents/
export async function fetchLeadDocuments(leadId) {
  await sleep(180);
  return _documents
    .filter((d) => d.lead === leadId)
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return new Date(b.created_at) - new Date(a.created_at);
    });
}

// addLeadDocument() → POST /api/leads/:id/documents/
//
// Accepts either a file row (`kind: 'file'` + `file` URL/path) or a URL
// row (`kind: 'url'` + `url` external link). The mock layer only stores
// strings — real backend will accept multipart/form-data for file rows
// and persist to S3 / local media.
export async function addLeadDocument({ lead_id, kind, file, url, label }) {
  await sleep(280);
  const lead = _leads.find((l) => l.id === lead_id);
  if (!lead) {
    const err = new Error("lead_not_found");
    err.code = "lead_not_found";
    throw err;
  }
  if (kind !== "file" && kind !== "url") {
    const err = new Error("invalid_kind");
    err.code = "invalid_kind";
    throw err;
  }
  if (kind === "file" && !file) {
    const err = new Error("file_required");
    err.code = "file_required";
    throw err;
  }
  if (kind === "url" && !url) {
    const err = new Error("url_required");
    err.code = "url_required";
    throw err;
  }
  const trimmedLabel = (label ?? "").trim();
  if (!trimmedLabel) {
    const err = new Error("label_required");
    err.code = "label_required";
    throw err;
  }
  const docId = (_documents.reduce((m, d) => Math.max(m, d.id), 0) || 0) + 1;
  const existingForLead = _documents.filter((d) => d.lead === lead_id);
  const sort_order = existingForLead.length;
  const doc = {
    id: docId,
    lead: lead_id,
    kind,
    file: kind === "file" ? file : null,
    url: kind === "url" ? url : null,
    label: trimmedLabel,
    sort_order,
    created_at: new Date().toISOString(),
  };
  MOCK_LEAD_DOCUMENTS.push(doc);
  _documents.push(doc);
  return doc;
}

// removeLeadDocument() → DELETE /api/leads/documents/:id/
export async function removeLeadDocument(documentId) {
  await sleep(220);
  const idx = _documents.findIndex((d) => d.id === documentId);
  if (idx === -1) {
    const err = new Error("document_not_found");
    err.code = "document_not_found";
    throw err;
  }
  const removed = _documents[idx];
  _documents.splice(idx, 1);
  const seedIdx = MOCK_LEAD_DOCUMENTS.findIndex((d) => d.id === documentId);
  if (seedIdx !== -1) MOCK_LEAD_DOCUMENTS.splice(seedIdx, 1);
  return removed;
}

// acknowledgeLead() → POST /api/leads/:id/acknowledge/
// "Reserve & View" — debits the reservation from the company wallet,
// flips to acknowledged, stamps tracking window expiry.
export async function acknowledgeLead(id) {
  if (typeof id === "string") {
    // Fetch lead with all fields needed for escrow + tracking
    const { data: lead } = await supabase.from("leads")
      .select("status, campaign_id, partner_id, total_reservation, client_full_name")
      .eq("id", id).single();
    if (!lead) return null;

    // Get campaign for company_id + tracking_window_days
    const { data: campaign } = await supabase.from("campaigns")
      .select("company_id, tracking_window_days")
      .eq("id", lead.campaign_id).single();
    if (!campaign) return null;

    const companyId = campaign.company_id;
    const trackingDays = campaign.tracking_window_days ?? 30;
    const amount = Number(lead.total_reservation ?? 0);

    // Debit the wallet — throws { code: 'insufficient_funds' } if balance too low
    const { reserveForLead } = await import("./escrow");
    await reserveForLead({
      companyId,
      leadId: id,
      amount,
      description: `Reserved for lead — ${lead.client_full_name}`,
    });

    // Flip lead to acknowledged
    const now = new Date();
    const expiry = new Date(now.getTime() + trackingDays * 86_400_000);
    const { data: updated, error } = await supabase.from("leads")
      .update({
        status: "acknowledged",
        acknowledged_at: now.toISOString(),
        tracking_window_expires_at: expiry.toISOString(),
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  }

  // Mock fallback
  await sleep(350);
  const idx = _leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const lead = _leads[idx];
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === lead.campaign);
  if (!campaign) return null;
  const { reserveForLead } = await import("./escrow");
  try { await reserveForLead({ companyId: campaign.company, leadId: id, amount: lead.total_reservation, description: `Reserved for lead — ${lead.client_full_name}` }); }
  catch (err) { throw err; }
  const now = new Date();
  const expiry = new Date(now.getTime() + campaign.tracking_window_days * 86_400_000);
  const updated = { ...lead, status: "acknowledged", acknowledged_at: now.toISOString(), tracking_window_expires_at: expiry.toISOString() };
  _leads[idx] = updated;
  const seedIdx = MOCK_LEADS.findIndex((l) => l.id === id);
  if (seedIdx !== -1) MOCK_LEADS[seedIdx] = updated;
  return updated;
}

// confirmSale() → POST /api/leads/:id/confirm-sale/
// Releases the reserved amount: moves total_reserved → total_paid_out on
// the wallet, writes release transactions, flips lead to converted.
export async function confirmSale(id) {
  if (typeof id === "string") {
    const { data: lead } = await supabase.from("leads")
      .select("pricing_tier_price, commission_amount, platform_fee_amount, total_reservation, client_full_name, campaign_id")
      .eq("id", id).single();
    if (!lead) return null;

    // Get company_id from campaign
    const { data: campaign } = await supabase.from("campaigns")
      .select("company_id")
      .eq("id", lead.campaign_id).single();

    if (campaign?.company_id) {
      const { releaseFromEscrowForLead } = await import("./escrow");
      await releaseFromEscrowForLead({
        companyId: campaign.company_id,
        leadId: id,
        originalReservation: Number(lead.total_reservation ?? 0),
        entries: [
          {
            type: "release_commission",
            amount: Number(lead.commission_amount ?? 0),
            description: `Commission released — ${lead.client_full_name}`,
          },
          {
            type: "release_platform_fee",
            amount: Number(lead.platform_fee_amount ?? 0),
            description: `Platform fee released — ${lead.client_full_name}`,
          },
        ],
      });
    }

    const { data: updated, error } = await supabase.from("leads")
      .update({
        status: "converted",
        actual_sale_amount: lead.pricing_tier_price ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  }

  // Mock fallback
  await sleep(400);
  const idx = _leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const lead = _leads[idx];
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === lead.campaign);
  if (!campaign) return null;
  const tier = (campaign.pricing_tiers ?? []).find((t) => t.id === lead.pricing_tier);
  if (!tier) return null;
  const { releaseFromEscrowForLead } = await import("./escrow");
  await releaseFromEscrowForLead({ companyId: campaign.company, leadId: id, originalReservation: lead.total_reservation,
    entries: [
      { type: "release_commission", amount: lead.commission_amount, description: `Commission released — ${lead.client_full_name}` },
      { type: "release_platform_fee", amount: lead.platform_fee_amount, description: `Platform fee released — ${lead.client_full_name}` },
    ],
  });
  const updated = { ...lead, status: "converted", actual_sale_amount: tier.price, resolved_at: new Date().toISOString() };
  _leads[idx] = updated;
  const seedIdx = MOCK_LEADS.findIndex((l) => l.id === id);
  if (seedIdx !== -1) MOCK_LEADS[seedIdx] = updated;
  return updated;
}

// denyConversion() → POST /api/leads/:id/deny/
// Flips to disputed_verifying; escrow stays frozen until admin resolves.
export async function denyConversion(id, { reason }) {
  const trimmed = (reason ?? "").trim();
  if (!trimmed) { const e = new Error("reason_required"); e.code = "reason_required"; throw e; }

  if (typeof id === "string") {
    const { data: updated, error } = await supabase.from("leads")
      .update({ status: "disputed_verifying", denial_reason: trimmed })
      .eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return updated;
  }

  // Mock fallback
  await sleep(350);
  const idx = _leads.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  const updated = { ..._leads[idx], status: "disputed_verifying", denial_reason: trimmed };
  _leads[idx] = updated;
  const seedIdx = MOCK_LEADS.findIndex((l) => l.id === id);
  if (seedIdx !== -1) MOCK_LEADS[seedIdx] = updated;
  return updated;
}

// trackClick() → POST /api/leads/track-click/
export async function trackClick(partnerLinkId) {
  await sleep(100);
  void partnerLinkId;
  return null;
}
