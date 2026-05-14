"use client";

/**
 * LeadCreatePage — `/leads/new` route. Partner's primary money action:
 * register a hot prospect on a campaign they're approved on.
 *
 * Composition lives in `lead-create/`:
 *   - use-lead-create-form.js → state + validation + submit handler
 *   - LeadCreateForm.jsx      → 3-section form + footer actions
 *   - LeadCreateTipCard.jsx   → sticky right-rail tip
 *   - NoEligibleEmpty.jsx     → empty state when zero eligible campaigns
 *   - FormSection.jsx         → small overlined section wrapper
 *
 * URL param `?campaign=<slug>` pre-selects the campaign (deep-linked
 * from the /applications "Submit a lead for this campaign" button).
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/shared/layout/PageHeader";
import { useAuth } from "@/components/providers/AuthProvider";
import { fetchPartnerEligibleCampaigns } from "@/lib/mock/campaigns";
import LeadCreateForm from "./lead-create/LeadCreateForm";
import LeadCreateTipCard from "./lead-create/LeadCreateTipCard";
import NoEligibleEmpty from "./lead-create/NoEligibleEmpty";
import { useLeadCreateForm } from "./lead-create/use-lead-create-form";

export default function LeadCreatePage() {
  const t = useTranslations("LeadForm");
  const { user } = useAuth();
  const userId = user?.id;
  const searchParams = useSearchParams();
  const preselectedSlug = searchParams.get("campaign");

  const { data: eligibleCampaigns = [], isLoading: loadingCampaigns } = useQuery({
    queryKey: ["partner-eligible-campaigns", { userId }],
    queryFn: () => fetchPartnerEligibleCampaigns({ userId }),
    enabled: !!userId,
  });

  const form = useLeadCreateForm({ userId, eligibleCampaigns, preselectedSlug });

  const breadcrumbs = [
    { label: t("back"), href: "/leads" },
    { label: t("title") },
  ];
  const isEmpty = !loadingCampaigns && eligibleCampaigns.length === 0;

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={breadcrumbs}
      />
      {isEmpty ? (
        <NoEligibleEmpty t={t} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1.5em]">
          <LeadCreateForm form={form} eligibleCampaigns={eligibleCampaigns} t={t} />
          <aside className="lg:col-span-4 lg:sticky lg:top-[1.5em] lg:self-start">
            <LeadCreateTipCard selectedCampaign={form.selectedCampaign} t={t} />
          </aside>
        </div>
      )}
    </div>
  );
}
