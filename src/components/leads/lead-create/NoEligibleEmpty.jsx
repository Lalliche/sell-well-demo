"use client";

/**
 * Empty state shown on /leads/new when the partner has zero
 * approved-AND-active campaigns to submit a lead for.
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { FiInbox } from "react-icons/fi";
import EmptyState from "@/components/shared/feedback/EmptyState";
import AppButton from "@/components/ui/Buttons";

export default function NoEligibleEmpty({ t }) {
  return (
    <div className="bg-surface border border-border-light rounded-[0.625em] shadow-xs">
      <EmptyState
        icon={<FiInbox strokeWidth={1.5} />}
        title={t("campaign.noOptionsTitle")}
        subtitle={t("campaign.noOptionsBody")}
        action={
          <IntlLink href="/marketplace">
            <AppButton size="sm" variant="primary">
              {t("campaign.noOptionsCta")}
            </AppButton>
          </IntlLink>
        }
      />
    </div>
  );
}
