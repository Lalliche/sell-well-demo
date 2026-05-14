"use client";

/**
 * Expanded notification row for the /notifications feed page.
 *
 * Shape mirrors NotificationRow (popover) but with the body text visible
 * and slightly more vertical space — feed rows are the user's primary
 * read surface, not a quick-glance dropdown.
 *
 * Click → mark-read (if unread) + navigate to the related object's route
 * (resolved by `notificationHref`). Caller passes `onSelect(notification)`
 * to centralize that orchestration.
 */

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format/relative-time";
import {
  getNotificationIcon,
  getToneClass,
} from "./notification-icons";

export default function NotificationFeedRow({ notification, onSelect }) {
  const t = useTranslations("Dashboard.Notifications");
  const tTime = useTranslations("Dashboard.Notifications.Time");

  const { Icon, tone } = getNotificationIcon(notification.related_object_type);
  const unread = !notification.is_read;
  const time = formatRelative(notification.created_at, tTime);

  return (
    <button
      type="button"
      onClick={() => onSelect(notification)}
      className={cn(
        "w-full flex items-start gap-[0.875em] px-[1em] py-[1em] text-left",
        "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:bg-bg-alt",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 inline-flex items-center justify-center w-[2em] h-[2em] rounded-full",
          "bg-accent-light",
          getToneClass(tone),
        )}
      >
        <Icon size="0.9375em" strokeWidth={1.75} />
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-[0.25em]">
        <div className="flex items-baseline gap-[0.625em] min-w-0">
          {unread && <span className="sr-only">{t("unreadSr")} </span>}
          <p
            className={cn(
              "flex-1 min-w-0 text-[0.875em] leading-[1.4] truncate",
              unread ? "text-text font-semibold" : "text-text-secondary",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-[0.6875em] text-text-muted leading-[1.2] font-mono">
            {time}
          </span>
        </div>
        <p className="text-[0.8125em] text-text-secondary leading-[1.5] line-clamp-2">
          {notification.body}
        </p>
      </div>

      {unread && (
        <span
          aria-hidden="true"
          className="shrink-0 mt-[0.5em] w-[0.5em] h-[0.5em] rounded-full bg-accent"
        />
      )}
    </button>
  );
}
