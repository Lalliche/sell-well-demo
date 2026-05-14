"use client";

/** Per-tab empty state for /applications. */

import { Link as IntlLink } from "@/i18n/navigation";
import { FiInbox, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import EmptyState from "@/components/shared/feedback/EmptyState";
import AppButton from "@/components/ui/Buttons";

const TAB_ICONS = {
  all: FiInbox,
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

export default function ApplicationsEmptyState({ tab, t }) {
  const namespace = `empty.${tab}`;
  const Icon = TAB_ICONS[tab] ?? FiInbox;
  const action =
    tab === "all" ? (
      <IntlLink href="/marketplace">
        <AppButton size="sm" variant="primary">{t("empty.all.cta")}</AppButton>
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
