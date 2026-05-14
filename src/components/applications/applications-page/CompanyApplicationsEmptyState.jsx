"use client";

/** Per-tab empty state for the company-side /applications. */

import { FiInbox, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import EmptyState from "@/components/shared/feedback/EmptyState";

const TAB_ICONS = {
  all: FiInbox,
  pending: FiClock,
  approved: FiCheckCircle,
  rejected: FiXCircle,
};

export default function CompanyApplicationsEmptyState({ tab, t }) {
  const Icon = TAB_ICONS[tab] ?? FiInbox;
  return (
    <EmptyState
      icon={<Icon strokeWidth={1.5} />}
      title={t(`empty.${tab}.title`)}
      subtitle={t(`empty.${tab}.body`)}
    />
  );
}
