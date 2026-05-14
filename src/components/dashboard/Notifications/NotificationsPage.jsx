"use client";

/**
 * Notifications feed page — full list of all notifications for the
 * current user.
 *
 * Composition:
 *   PageHeader (title + description + Mark-all-read action)
 *   Filter chips (All / Unread / Read)
 *   Grouped list (Today / Yesterday / Earlier this week / Earlier)
 *   Pagination (Prev / Next)
 *   Empty state when filter yields zero rows
 *
 * Reuses the React Query hooks from `useNotifications` so the bell badge,
 * popover, and this page all share one cache. Optimistic mark-read +
 * mark-all-read patches all caches in lockstep.
 */

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Inbox as InboxIcon, BellRing } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/layout/PageHeader";
import StatusTabs from "@/components/shared/data-display/StatusTabs";
import AppButton from "@/components/ui/Buttons";
import NotificationPreferencesTab from "./preferences/NotificationPreferencesTab";
import {
  useNotifications,
  useMarkOneRead,
  useMarkAllRead,
} from "@/lib/hooks/useNotifications";
import { useToast } from "@/hooks/useToast";
import { groupByDate } from "@/lib/format/group-by-date";
import NotificationFeedRow from "./NotificationFeedRow";
import { notificationHref } from "./notification-routes";
import { useAuth } from "@/components/providers/AuthProvider";

const PAGE_SIZE = 20;
const FILTERS = ["all", "unread", "read"];

export default function NotificationsPage() {
  const t = useTranslations("Dashboard.NotificationsPage");
  const tNotif = useTranslations("Dashboard.Notifications");
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useNotifications();
  const markOne = useMarkOneRead();
  const markAll = useMarkAllRead();

  // Top-of-page tab strip: Inbox (default — current feed) + Preferences
  // (notification settings, moved here from the deleted /settings page).
  const [tab, setTab] = useState("inbox");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (filter === "unread") return notifications.filter((n) => !n.is_read);
    if (filter === "read") return notifications.filter((n) => n.is_read);
    return notifications;
  }, [filter, notifications]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);
  const groups = useMemo(() => groupByDate(pageItems), [pageItems]);

  const unread = notifications.filter((n) => !n.is_read).length;

  function handleSelect(n) {
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

  function handleFilterChange(next) {
    setFilter(next);
    setPage(0);
  }

  const pageTabs = [
    { key: "inbox",       label: t("tabs.inbox"),       icon: InboxIcon },
    { key: "preferences", label: t("tabs.preferences"), icon: BellRing },
  ];

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          tab === "inbox" ? (
            <AppButton
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={unread === 0 || markAll.isPending}
              isLoading={markAll.isPending}
            >
              <Check size="0.875em" strokeWidth={2} />
              {tNotif("markAllRead")}
            </AppButton>
          ) : null
        }
      />

      <StatusTabs tabs={pageTabs} activeKey={tab} onChange={setTab} />

      {tab === "inbox" ? (
        <>
          <FilterChips
            value={filter}
            onChange={handleFilterChange}
            counts={{
              all: notifications.length,
              unread,
              read: notifications.length - unread,
            }}
          />

          <div className="bg-surface border border-border-light rounded-[0.75em] overflow-hidden">
            {isLoading ? (
              <FeedSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState filter={filter} />
            ) : (
              <ul className="flex flex-col">
                {groups.map((group, groupIdx) => (
                  <li key={group.key}>
                    <DateHeading label={t(`groups.${group.key}`)} />
                    <ul className="flex flex-col divide-y divide-border-light">
                      {group.items.map((n) => (
                        <li key={n.id}>
                          <NotificationFeedRow
                            notification={n}
                            onSelect={handleSelect}
                          />
                        </li>
                      ))}
                    </ul>
                    {groupIdx < groups.length - 1 && (
                      <div className="h-px bg-border-light" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {filtered.length > PAGE_SIZE && (
            <Pagination
              page={safePage}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </>
      ) : (
        <NotificationPreferencesTab />
      )}
    </div>
  );
}

/* ── Filter chips ──────────────────────────────────────────────────────── */

function FilterChips({ value, onChange, counts }) {
  const t = useTranslations("Dashboard.NotificationsPage.filter");
  return (
    <div role="tablist" className="flex items-center gap-[0.375em] flex-wrap">
      {FILTERS.map((key) => {
        const isActive = value === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(key)}
            className={cn(
              "inline-flex items-center gap-[0.5em] h-[2em] px-[0.875em] rounded-full",
              "text-[0.75em] font-medium",
              "transition-[background-color,color,border-color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
              "border",
              isActive
                ? "bg-accent-light text-accent-text border-[var(--accent-border)]"
                : "bg-surface text-text-secondary border-border-light hover:border-border hover:text-text",
            )}
          >
            {t(key)}
            <span
              className={cn(
                "font-mono text-[0.875em] leading-none",
                isActive ? "text-accent-text" : "text-text-muted",
              )}
            >
              {counts[key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Date heading ──────────────────────────────────────────────────────── */

function DateHeading({ label }) {
  return (
    <div className="px-[1em] pt-[1em] pb-[0.5em] bg-bg-alt/40">
      <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
        {label}
      </span>
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────────────── */

function EmptyState({ filter }) {
  const t = useTranslations("Dashboard.NotificationsPage.empty");
  const titleKey = filter === "unread" ? "unreadTitle" : filter === "read" ? "readTitle" : "allTitle";
  const bodyKey = filter === "unread" ? "unreadBody" : filter === "read" ? "readBody" : "allBody";

  return (
    <div className="flex flex-col items-center text-center gap-[0.375em] px-[1.5em] py-[3em]">
      <span className="text-[0.875em] font-medium text-text">{t(titleKey)}</span>
      <span className="text-[0.8125em] text-text-muted leading-[1.5] max-w-[28em]">
        {t(bodyKey)}
      </span>
    </div>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────────────── */

function FeedSkeleton() {
  return (
    <ul className="flex flex-col divide-y divide-border-light">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-start gap-[0.875em] px-[1em] py-[1em]">
          <span className="shrink-0 w-[2em] h-[2em] rounded-full bg-bg-alt" />
          <div className="flex-1 flex flex-col gap-[0.5em]">
            <span className="block h-[0.75em] w-[60%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[90%] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[75%] rounded-[0.25em] bg-bg-alt" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── Pagination ────────────────────────────────────────────────────────── */

function Pagination({ page, totalPages, onChange }) {
  const t = useTranslations("Dashboard.NotificationsPage.pagination");
  return (
    <div className="mt-[1em] flex items-center justify-between gap-[0.5em]">
      <AppButton
        variant="ghost"
        size="sm"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        {t("prev")}
      </AppButton>
      <span className="text-[0.75em] text-text-muted font-mono">
        {t("page", { page: page + 1, total: totalPages })}
      </span>
      <AppButton
        variant="ghost"
        size="sm"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        {t("next")}
      </AppButton>
    </div>
  );
}
