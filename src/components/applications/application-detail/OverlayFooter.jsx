"use client";

/**
 * OverlayFooter — state-aware footer for the application detail overlay.
 *   - Always renders the "Open campaign" link.
 *   - Approved + active campaign → adds the "Submit a lead" CTA
 *     (per the 6.5 placement research; deep-links via ?campaign=<slug>).
 *   - Rejected with cooldown still counting → muted countdown chip.
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { ExternalLink, Send, Clock } from "lucide-react";
import AppButton from "@/components/ui/Buttons";

export default function OverlayFooter({ campaign, isApproved, isRejected, canReapply, cooldownDays, t }) {
  const campaignHref = `/marketplace/${campaign.slug}`;
  const showSubmitLead = isApproved && campaign.status === "active";
  const showCooldown = isRejected && !canReapply && cooldownDays !== null;

  return (
    <>
      <IntlLink href={campaignHref}>
        <AppButton variant="secondary" size="sm">
          <span className="inline-flex items-center gap-[0.375em]">
            <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            {t("actions.openCampaign")}
          </span>
        </AppButton>
      </IntlLink>
      {showSubmitLead && (
        <IntlLink href={`/leads/new?campaign=${campaign.slug}`}>
          <AppButton variant="accent" size="sm">
            <span className="inline-flex items-center gap-[0.375em]">
              <Send className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
              {t("actions.submitLead")}
            </span>
          </AppButton>
        </IntlLink>
      )}
      {showCooldown && (
        <span className="inline-flex items-center gap-[0.375em] h-[2em] px-[0.875em] rounded-[0.5em] bg-bg-alt text-[0.8125em] font-medium text-text-muted">
          <Clock className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {t("actions.reapplyCooldown", { days: cooldownDays })}
        </span>
      )}
    </>
  );
}
