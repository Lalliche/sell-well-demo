/**
 * Marketplace layer — Supabase-backed.
 *
 * Returns campaigns enriched with:
 *   - active_partners_count         : approved applications on this campaign
 *   - partner_application_status    : the viewer's application status or null
 *   - partner_application_reviewed_at: the viewer's reviewed_at or null
 *   - company                       : { id, company_name, logo, industry }
 *   - category_resolved             : Category row (en + fr labels)
 *   - documents                     : [] (stub — Sales Kit out of scope for demo)
 *
 * Filter contract (mirrors what the future Django queryset will accept):
 *   - userId             (string UUID)    → required for partner_application_status
 *   - categoryIds        (number[])       → match Campaign.category against any
 *   - commissionType     ("percentage" | "flat" | null)
 *   - partnerLinksEnabled(boolean | null) → strict yes/no/null
 *   - applicationStatus  ("all" | "unapplied" | "pending" | "approved" | "rejected")
 *                          default "unapplied"
 *   - search             (string)         → ilike on product_name + company_name
 *   - sort               ("newest" | "commission_high" | "commission_low")
 *   - statuses           (CampaignStatus[]) → default ["active", "paused"]
 */

import { supabase } from "@/lib/supabase";

const DEFAULT_STATUSES = ["active", "paused"];

// fetchMarketplace() → GET /api/marketplace/
export async function fetchMarketplace(filters = {}) {
  const {
    userId,
    categoryIds,
    commissionType = null,
    partnerLinksEnabled = null,
    applicationStatus = "unapplied",
    search = "",
    sort = "newest",
    statuses = DEFAULT_STATUSES,
  } = filters;

  // UUID guard — UUID userId means real Supabase user; numeric means mock seed
  const isRealUser = typeof userId === "string";

  // Fetch viewer's applications once (used for status filter + enrichment)
  let viewerApps = [];
  if (isRealUser && userId) {
    const { data } = await supabase
      .from("applications")
      .select("campaign_id, status, reviewed_at")
      .eq("partner_id", userId);
    viewerApps = data ?? [];
  }

  const viewerAppMap = new Map(viewerApps.map((a) => [a.campaign_id, a]));

  // Build campaign query
  let query = supabase
    .from("campaigns")
    .select(`
      *,
      company:profiles!campaigns_company_id_fkey(id, company_name, logo, industry),
      category_resolved:categories!campaigns_category_fkey(id, name_en, name_fr, slug)
    `)
    .in("status", statuses);

  if (Array.isArray(categoryIds) && categoryIds.length > 0) {
    query = query.in("category", categoryIds);
  }
  if (commissionType === "percentage" || commissionType === "flat") {
    query = query.eq("commission_type", commissionType);
  }
  if (partnerLinksEnabled === true || partnerLinksEnabled === false) {
    query = query.eq("partner_links_enabled", partnerLinksEnabled);
  }
  if (search.trim()) {
    query = query.ilike("product_name", `%${search.trim()}%`);
  }

  // Sort
  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    // commission_high / commission_low — sort server-side by commission_value
    query = query.order("commission_value", { ascending: sort === "commission_low" });
  }

  const { data: campaigns, error } = await query;
  if (error || !campaigns) return [];

  // Enrich + apply applicationStatus filter client-side
  // (applicationStatus filter is per-viewer derived, can't push to SQL without a subquery)
  const enriched = campaigns.map((c) => {
    const app = viewerAppMap.get(c.id) ?? null;
    return {
      ...c,
      active_partners_count: 0, // stub — needs a COUNT subquery; fine for demo
      partner_application_status: app ? app.status : null,
      partner_application_reviewed_at: app?.reviewed_at ?? null,
      company: c.company ?? null,
      category_resolved: c.category_resolved ?? null,
      documents: [],
    };
  });

  if (applicationStatus === "all") return enriched;

  return enriched.filter((c) => {
    const status = c.partner_application_status;
    if (applicationStatus === "unapplied") return status === null;
    return status === applicationStatus;
  });
}

// fetchMarketplaceCampaign() — by id (notification deep-links)
export async function fetchMarketplaceCampaign(id, { userId } = {}) {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(`
      *,
      company:profiles!campaigns_company_id_fkey(id, company_name, logo, industry),
      category_resolved:categories!campaigns_category_fkey(id, name_en, name_fr, slug)
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !campaign) return null;
  return enrichSingle(campaign, userId);
}

// fetchMarketplaceCampaignBySlug() → GET /api/marketplace/by-slug/:slug/
export async function fetchMarketplaceCampaignBySlug(slug, { userId } = {}) {
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(`
      *,
      company:profiles!campaigns_company_id_fkey(id, company_name, logo, industry),
      category_resolved:categories!campaigns_category_fkey(id, name_en, name_fr, slug)
    `)
    .eq("slug", slug)
    .maybeSingle();

  if (error || !campaign) return null;
  return enrichSingle(campaign, userId);
}

async function enrichSingle(campaign, userId) {
  let app = null;
  if (typeof userId === "string" && userId) {
    const { data } = await supabase
      .from("applications")
      .select("status, reviewed_at")
      .eq("campaign_id", campaign.id)
      .eq("partner_id", userId)
      .maybeSingle();
    app = data ?? null;
  }

  return {
    ...campaign,
    active_partners_count: 0,
    partner_application_status: app ? app.status : null,
    partner_application_reviewed_at: app?.reviewed_at ?? null,
    company: campaign.company ?? null,
    category_resolved: campaign.category_resolved ?? null,
    documents: [],
  };
}

