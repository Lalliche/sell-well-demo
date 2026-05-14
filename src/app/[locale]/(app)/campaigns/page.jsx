"use client";

/**
 * /campaigns — company-side campaign management page (Phase 7.2).
 *
 * Role-branched. Sales partners don't have a /campaigns route — they
 * browse via /marketplace. Admin would land on a future admin-scoped
 * variant. For v1, only role==="company" gets a real page; everyone else
 * sees a minimal forwarder screen pointing them at the right surface.
 */

import { useAuth } from "@/components/providers/AuthProvider";
import { Link } from "@/i18n/navigation";
import PageHeader from "@/components/shared/layout/PageHeader";
import CompanyCampaignsPage from "@/components/campaigns/CompanyCampaignsPage";

export default function CampaignsRoute() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "company") return <CompanyCampaignsPage />;

  // Partners + admins land here only via stale links. Send them to the
  // right surface without a hard redirect (SPA navigation feel).
  return (
    <div className="px-[2em] py-[2em]">
      <PageHeader
        title="Campaigns"
        description={
          user.role === "sales_partner"
            ? "Sales partners browse campaigns from the marketplace."
            : "This page is for tech companies. Admins manage campaigns from the admin panel."
        }
      />
      {user.role === "sales_partner" && (
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-[0.5em] h-[2.5em] px-[1.125em] rounded-[0.5em] bg-cta text-cta-text text-[0.8125em] font-semibold shadow-sm hover:bg-cta-hover hover:shadow-md transition-[background-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-[1px]"
        >
          Go to marketplace
        </Link>
      )}
    </div>
  );
}
