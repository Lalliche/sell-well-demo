"use client";

/**
 * GenerateLinkPanel — accent-tinted banner above the /partner-links table
 * surfacing the campaigns the partner can generate a link for. Only
 * renders when at least one eligible campaign exists.
 *
 * Eligibility (computed in the mock layer's
 * `fetchEligibleCampaignsForLinks`):
 *   - approved CampaignApplication
 *   - campaign.status === 'active'
 *   - campaign.partner_links_enabled === true
 *   - no PartnerLink already exists for this (partner, campaign) pair
 *
 * Picks one campaign at a time via the shared DropdownInput, then fires
 * `generatePartnerLink`. On success: invalidates the partner-links query
 * so the new row appears at the top of the table immediately.
 *
 * Validation toast: when the partner clicks Generate without picking a
 * campaign, fire the shared `Common.formErrors{Title,Body}` warning toast
 * per the project rule (Skills/dos-and-donts.md → Forms).
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { DropdownInput } from "@/components/ui/FormInputs";
import { useToast } from "@/hooks/useToast";
import { generatePartnerLink } from "@/lib/mock/partner-links";

export default function GenerateLinkPanel({ eligibleCampaigns, userId, t }) {
  const tCommon = useTranslations("Common");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [campaignId, setCampaignId] = useState(null);

  const mutation = useMutation({
    mutationFn: generatePartnerLink,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-links"] });
      queryClient.invalidateQueries({ queryKey: ["partner-links-eligible"] });
      toast.success(t("generate.successBody"), { title: t("generate.successTitle") });
      setCampaignId(null);
    },
    onError: (err) => {
      const code = err?.code ?? "generic";
      const key =
        code === "link_already_exists"
          ? "generate.errors.linkExists"
          : code === "partner_links_disabled"
            ? "generate.errors.disabled"
            : code === "not_approved"
              ? "generate.errors.notApproved"
              : "generate.errors.generic";
      toast.error(t(key));
    },
  });

  const options = eligibleCampaigns.map((c) => ({
    value: c.id,
    label: c.company?.company_name
      ? `${c.product_name} — ${c.company.company_name}`
      : c.product_name,
  }));

  const handleGenerate = () => {
    if (!campaignId) {
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
      return;
    }
    mutation.mutate({ campaign_id: campaignId, partner_id: userId });
  };

  if (eligibleCampaigns.length === 0) return null;

  return (
    <div className="flex flex-col gap-[0.875em] bg-accent-light/40 border border-accent/20 rounded-[0.625em] p-[1.25em]">
      <div className="flex items-start gap-[0.625em]">
        <span className="inline-flex items-center justify-center w-[2em] h-[2em] rounded-[0.5em] bg-accent/15 text-accent shrink-0">
          <Zap className="w-[1em] h-[1em]" strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.875em] font-semibold text-text">
            {t("generate.title", { count: eligibleCampaigns.length })}
          </span>
          <span className="text-[0.75em] text-text-secondary leading-[1.5]">
            {t("generate.body")}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-[0.625em]">
        <div className="flex-1 min-w-0">
          <DropdownInput
            label={t("generate.dropdownLabel")}
            placeholder={t("generate.dropdownPlaceholder")}
            options={options}
            value={campaignId}
            onChange={setCampaignId}
          />
        </div>
        <AppButton
          variant="accent"
          size="md"
          onClick={handleGenerate}
          isLoading={mutation.isPending}
        >
          <span className="inline-flex items-center gap-[0.375em]">
            <Zap className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
            {mutation.isPending ? t("generate.generating") : t("generate.cta")}
          </span>
        </AppButton>
      </div>
    </div>
  );
}
