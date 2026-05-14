"use client";

/**
 * Body of the notification popover.
 *
 * Three states:
 *   loading  : 3 skeleton lines (matches the row height roughly).
 *   empty    : friendly bell + "all caught up" message.
 *   ready    : up to MAX_VISIBLE rows from the newest end of the list.
 *
 * Caller owns the data (via useNotifications) so this component stays
 * presentational. `onSelect(notification)` bubbles up to the popover
 * parent, which handles mark-read + navigation + close.
 */

import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import NotificationRow from "./NotificationRow";

const MAX_VISIBLE = 5;

export default function NotificationList({
  notifications,
  isLoading,
  onSelect,
}) {
  const t = useTranslations("Dashboard.Notifications");

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[0, 1, 2].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center text-center gap-[0.5em] px-[1em] py-[2.25em]">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center w-[2.25em] h-[2.25em] rounded-full bg-accent-light text-accent-text"
        >
          <Bell size="1em" strokeWidth={1.75} />
        </span>
        <span className="text-[0.875em] font-medium text-text">
          {t("empty.title")}
        </span>
        <span className="text-[0.75em] text-text-muted leading-[1.5] max-w-[18em]">
          {t("empty.body")}
        </span>
      </div>
    );
  }

  const visible = notifications.slice(0, MAX_VISIBLE);
  return (
    <ul className="flex flex-col divide-y divide-border-light">
      {visible.map((n) => (
        <li key={n.id}>
          <NotificationRow notification={n} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-[0.75em] px-[1em] py-[0.875em]">
      <span className="shrink-0 w-[1.75em] h-[1.75em] rounded-full bg-bg-alt" />
      <div className="flex-1 flex flex-col gap-[0.375em] mt-[0.125em]">
        <span className="block h-[0.6875em] w-[80%] rounded-[0.25em] bg-bg-alt" />
        <span className="block h-[0.5em] w-[40%] rounded-[0.25em] bg-bg-alt" />
      </div>
    </div>
  );
}
