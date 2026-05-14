"use client";

/**
 * Single notification row inside the popover.
 *
 * One line: per-type icon + title (bold when unread, dimmed when read) +
 * relative timestamp + an unread accent dot at the trailing edge.
 *
 * Spec choice (locked in 5.4 plan): popover rows are title-only. The body
 * field renders only on the /notifications feed page (Phase 5.7) so the
 * popover stays scannable.
 *
 * Click delegates to the parent's `onSelect(notification)` — the parent
 * owns mark-read + navigation + popover-close orchestration. This row is
 * a pure rendering button.
 */

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format/relative-time";
import {
  getNotificationIcon,
  getToneClass,
} from "./notification-icons";

export default function NotificationRow({ notification, onSelect }) {
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
        "w-full flex items-start gap-[0.75em] px-[1em] py-[0.75em] text-left",
        "hover:bg-bg-alt transition-[background-color] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:bg-bg-alt",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          // Icon sits in a soft tinted circle so it reads as a category
          // marker, not a stray glyph next to the text.
          "shrink-0 inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-full",
          "bg-accent-light",
          getToneClass(tone),
        )}
      >
        <Icon size="0.875em" strokeWidth={1.75} />
      </span>

      <div className="flex-1 min-w-0 flex flex-col gap-[0.125em]">
        {unread && <span className="sr-only">{t("unreadSr")} </span>}
        <p
          className={cn(
            "text-[0.8125em] leading-[1.4] truncate",
            unread ? "text-text font-semibold" : "text-text-secondary",
          )}
        >
          {notification.title}
        </p>
        <span className="text-[0.6875em] text-text-muted leading-[1.2]">
          {time}
        </span>
      </div>

      {unread && (
        <span
          aria-hidden="true"
          className="shrink-0 mt-[0.625em] w-[0.5em] h-[0.5em] rounded-full bg-accent"
        />
      )}
    </button>
  );
}
