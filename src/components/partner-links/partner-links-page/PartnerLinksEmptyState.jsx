"use client";

/**
 * Per-tab empty state for /partner-links. The "all" tab gets a hero CTA
 * pointing the partner at the marketplace (since they need an approved
 * application on a partner-links-enabled campaign before any link can
 * exist); other tabs get a quieter informational empty state.
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { FiLink, FiActivity, FiPauseCircle, FiZap, FiArrowRight } from "react-icons/fi";
import EmptyState from "@/components/shared/feedback/EmptyState";
import AppButton from "@/components/ui/Buttons";

const TAB_ICONS = {
  all: FiLink,
  active: FiActivity,
  noActivity: FiZap,
  paused: FiPauseCircle,
};

export default function PartnerLinksEmptyState({ tab, t }) {
  const namespace = `empty.${tab}`;
  const Icon = TAB_ICONS[tab] ?? FiLink;
  const action =
    tab === "all" ? (
      <IntlLink href="/marketplace">
        <AppButton size="md" variant="primary">
          <span className="inline-flex items-center gap-[0.375em]">
            {t("empty.all.cta")}
            <FiArrowRight size="0.875em" strokeWidth={2.25} />
          </span>
        </AppButton>
      </IntlLink>
    ) : null;
  return (
    <EmptyState
      icon={<Icon strokeWidth={1.5} />}
      title={t(`${namespace}.title`)}
      subtitle={t(`${namespace}.body`)}
      action={action}
    />
  );
}
