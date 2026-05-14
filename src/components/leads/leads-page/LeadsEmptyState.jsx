"use client";

/**
 * Per-tab empty state for /leads. The "all" tab gets the prominent
 * "Submit your first lead" hero CTA; other tabs get a quieter
 * informational empty state.
 */

import { Link as IntlLink } from "@/i18n/navigation";
import { FiInbox, FiActivity, FiAlertTriangle, FiClock, FiArchive, FiPlus, FiEdit3 } from "react-icons/fi";
import EmptyState from "@/components/shared/feedback/EmptyState";
import AppButton from "@/components/ui/Buttons";

const TAB_ICONS = {
  all: FiInbox,
  draft: FiEdit3,
  active: FiActivity,
  expiringSoon: FiAlertTriangle,
  awaiting: FiClock,
  closed: FiArchive,
};

export default function LeadsEmptyState({ tab, t }) {
  const namespace = `empty.${tab}`;
  const Icon = TAB_ICONS[tab] ?? FiInbox;
  const action =
    tab === "all" || tab === "draft" ? (
      <IntlLink href="/leads/new">
        <AppButton size="md" variant="primary">
          <span className="inline-flex items-center gap-[0.375em]">
            <FiPlus size="0.875em" strokeWidth={2.25} />
            {t(`empty.${tab}.cta`)}
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
