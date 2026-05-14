"use client";

/** Per-tab empty state for the company-side /leads inbox. */

import { FiInbox, FiClock, FiActivity, FiAlertTriangle, FiArchive } from "react-icons/fi";
import EmptyState from "@/components/shared/feedback/EmptyState";

const TAB_ICONS = {
  all: FiInbox,
  awaitingReserve: FiClock,
  inWindow: FiActivity,
  awaitingConfirm: FiAlertTriangle,
  disputed: FiAlertTriangle,
  closed: FiArchive,
};

export default function CompanyLeadsInboxEmptyState({ tab, t }) {
  const Icon = TAB_ICONS[tab] ?? FiInbox;
  return (
    <EmptyState
      icon={<Icon strokeWidth={1.5} />}
      title={t(`empty.${tab}.title`)}
      subtitle={t(`empty.${tab}.body`)}
    />
  );
}
