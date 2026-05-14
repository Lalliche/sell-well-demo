"use client";

/**
 * NotificationBell — header bell + Popover panel.
 *
 * Composes:
 *   - useNotifications()   list query (30s polling, no WebSocket)
 *   - useMarkOneRead()     optimistic per-row mark-read
 *   - useMarkAllRead()     optimistic mark-all-read (toast on success)
 *   - <NotificationList>   list / empty / skeleton states
 *
 * Click on a row:
 *   1. Close the popover immediately so it doesn't overlay the
 *      navigated page.
 *   2. Optimistically mark-read (if currently unread) — bell badge
 *      decrements before the network call settles.
 *   3. Navigate to the related-object route resolved by
 *      `notificationHref(n)`. If the row has no related object, just
 *      stay on the current page.
 *
 * Footer "View all" → /notifications (Phase 5.7 page).
 */

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Check } from "lucide-react";
import IconButton from "@/components/shared/data-display/IconButton";
import Popover from "@/components/shared/overlays/Popover";
import { useRouter, Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import {
  useNotifications,
  useMarkOneRead,
  useMarkAllRead,
} from "@/lib/hooks/useNotifications";
import NotificationList from "@/components/dashboard/Notifications/NotificationList";
import { notificationHref } from "@/components/dashboard/Notifications/notification-routes";
import { useAuth } from "@/components/providers/AuthProvider";

const MAX_BADGE = 9;

export default function NotificationBell() {
  const t = useTranslations("Dashboard.Header");
  const tNotif = useTranslations("Dashboard.Notifications");

  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  const { data: notifications = [], isLoading } = useNotifications();
  const markOne = useMarkOneRead();
  const markAll = useMarkAllRead();

  const unread = notifications.filter((n) => !n.is_read).length;
  const badge = unread > MAX_BADGE ? `${MAX_BADGE}+` : String(unread);

  function handleSelect(n) {
    setOpen(false);
    if (!n.is_read) markOne.mutate(n.id);
    const href = notificationHref(n, user?.role);
    if (href) router.push(href);
  }

  async function handleMarkAllRead() {
    if (unread === 0 || markAll.isPending) return;
    const count = unread;
    try {
      await markAll.mutateAsync();
      toast.success(tNotif("markedAllReadToast", { count }));
    } catch {
      toast.error(tNotif("markAllReadError"));
    }
  }

  return (
    <div className="relative">
      <IconButton
        ref={triggerRef}
        ariaLabel={t("notifications", { count: unread })}
        active={open}
        onClick={() => setOpen((v) => !v)}
        size="md"
      >
        <Bell size="1.125em" strokeWidth={1.75} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute -top-[0.25em] -right-[0.25em]",
              "inline-flex items-center justify-center",
              "min-w-[1.25em] h-[1.25em] px-[0.375em]",
              "rounded-full bg-accent text-cta-text",
              "text-[0.6875em] font-semibold leading-none font-mono tracking-tight",
              // Ring in the chrome bg color visually detaches the badge
              // from the bell so the digit doesn't crowd the icon.
              "ring-2 ring-bg-alt",
            )}
          >
            {badge}
          </span>
        )}
      </IconButton>

      <Popover
        open={open}
        onClose={() => setOpen(false)}
        triggerRef={triggerRef}
        className="w-[22em] max-w-[calc(100vw-2em)]"
      >
        <PopoverHeader
          unread={unread}
          onMarkAll={handleMarkAllRead}
          markAllPending={markAll.isPending}
        />
        <NotificationList
          notifications={notifications}
          isLoading={isLoading}
          onSelect={handleSelect}
        />
        <PopoverFooter onClose={() => setOpen(false)} />
      </Popover>
    </div>
  );
}

/* ── Header ────────────────────────────────────────────────────────────── */

function PopoverHeader({ unread, onMarkAll, markAllPending }) {
  const t = useTranslations("Dashboard.Notifications");
  return (
    <div className="flex items-center justify-between gap-[0.75em] px-[1em] pt-[1em] pb-[0.75em] border-b border-border-light">
      <div className="min-w-0 flex flex-col gap-[0.125em]">
        <span className="font-heading font-semibold text-[0.9375em] text-text leading-[1.2]">
          {t("title")}
        </span>
        <span className="text-[0.6875em] text-text-muted leading-[1.4]">
          {unread === 0
            ? t("allCaughtUp")
            : t("unreadCount", { count: unread })}
        </span>
      </div>
      {unread > 0 && (
        <button
          type="button"
          onClick={onMarkAll}
          disabled={markAllPending}
          className={cn(
            // Pill-shaped accent-tinted button. Reads unambiguously as an
            // affordance (hover bg deepens). Not using AppButton because
            // none of its variants ship with accent-tinted bg + accent
            // text — that combo is unique to this header and the
            // popover footer.
            "shrink-0 inline-flex items-center gap-[0.375em]",
            "h-[2em] px-[0.75em] rounded-[0.5em]",
            "text-[0.75em] font-semibold",
            "bg-accent-light text-accent-text",
            "hover:bg-[var(--accent-border)]",
            "transition-[background-color] duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent-light",
          )}
        >
          <Check size="0.875em" strokeWidth={2.25} />
          {t("markAllRead")}
        </button>
      )}
    </div>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────── */

function PopoverFooter({ onClose }) {
  const t = useTranslations("Dashboard.Notifications");
  return (
    <div className="px-[0.75em] py-[0.75em] border-t border-border-light">
      <Link
        href="/notifications"
        onClick={onClose}
        className={cn(
          "block w-full text-center",
          "h-[2.25em] inline-flex items-center justify-center",
          "rounded-[0.5em] border border-border bg-surface",
          "text-[0.8125em] font-semibold text-text",
          "hover:bg-bg-alt hover:border-text-muted",
          "transition-[background-color,border-color] duration-150 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
        )}
      >
        {t("viewAll")}
      </Link>
    </div>
  );
}
