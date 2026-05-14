"use client";

/**
 * Preferences tab — second tab on /notifications.
 *
 * Layout: a vertical stack of grouped cards. One card per domain
 * (Leads & sales, Applications, Partner Links, Earnings & withdrawals
 * for partners; Leads & sales, Applications, Escrow, Withdrawals for
 * companies). Order = catalog order.
 *
 * Data + mutation state lives in `use-notification-preferences.js`. This
 * component is the renderer.
 *
 * In-app column is rendered everywhere but always disabled with a
 * "Coming soon" caption, per V1 scope. Email is the active column.
 */

import { useTranslations } from "next-intl";
import { useAuth } from "@/components/providers/AuthProvider";
import { useNotificationPreferences } from "./use-notification-preferences";
import NotificationPreferenceCard from "./NotificationPreferenceCard";
import EmptyState from "@/components/shared/feedback/EmptyState";
import { BellOff } from "lucide-react";

export default function NotificationPreferencesTab() {
  const t = useTranslations("Dashboard.NotificationsPage.preferences");
  const { user } = useAuth();

  const {
    isLoading,
    groups,
    setEmail,
    muteGroupEmail,
    enableGroupEmail,
    getDisplayedEmail,
    savedAt,
    savedPillMs,
  } = useNotificationPreferences({
    userId: user?.id,
    role: user?.role,
  });

  if (isLoading) {
    return <PreferencesSkeleton />;
  }

  // Admin users (or any role with no catalog entries) see an empty state.
  // Today only partner + company have preferences; admin doesn't surface
  // this tab at all because the admin nav has no /notifications route in
  // the dock, but defensive empty state guards a future change.
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<BellOff size="2em" strokeWidth={1.5} />}
        title={t("empty.title")}
        subtitle={t("empty.body")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[1.25em]">
      <p className="text-[0.875em] text-text-secondary leading-[1.5] max-w-[55em]">
        {t("intro")}
      </p>

      <div className="flex flex-col gap-[1em]">
        {groups.map(({ group, rows }) => (
          <NotificationPreferenceCard
            key={group}
            group={group}
            rows={rows}
            getDisplayedEmail={getDisplayedEmail}
            onEmailChange={setEmail}
            onMuteAll={muteGroupEmail}
            onEnableAll={enableGroupEmail}
            savedAt={savedAt}
            savedPillMs={savedPillMs}
          />
        ))}
      </div>
    </div>
  );
}

function PreferencesSkeleton() {
  return (
    <div className="flex flex-col gap-[1em]">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-surface rounded-[0.75em] border border-border-light p-[1.5em] flex flex-col gap-[1em]"
        >
          <div className="flex flex-col gap-[0.375em]">
            <span className="block h-[1em] w-[12em] rounded-[0.25em] bg-bg-alt" />
            <span className="block h-[0.625em] w-[24em] rounded-[0.25em] bg-bg-alt" />
          </div>
          <div className="flex flex-col gap-[0.75em]">
            {[0, 1].map((j) => (
              <div key={j} className="flex items-center justify-between gap-[1em]">
                <span className="block h-[0.875em] w-[18em] rounded-[0.25em] bg-bg-alt" />
                <span className="block h-[1.25em] w-[5em] rounded-full bg-bg-alt" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
