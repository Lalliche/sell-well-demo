"use client";

/**
 * One card per group (Leads & sales / Applications / Partner Links / etc.).
 *
 * Anatomy:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ Group title                               In-app │ Email   │   ← header
 *   │ Group description                                          │
 *   ├────────────────────────────────────────────────────────────┤
 *   │ Event row …                                  [○]    [●]    │
 *   │ Event row …                                  [○]    [●]    │
 *   │ …                                                          │
 *   ├────────────────────────────────────────────────────────────┤
 *   │                                  [ Mute all email ]        │   ← footer
 *   └────────────────────────────────────────────────────────────┘
 *
 * Mute/Enable toggle: the footer button flips between "Mute all email"
 * and "Enable all email" depending on whether the card currently has any
 * email-capable row with `email === true`. Rows whose channel mode is
 * `in_app_only` are excluded from the all-on/all-off math.
 */

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";
import { BellOff, Bell } from "lucide-react";
import NotificationPreferenceRow from "./NotificationPreferenceRow";

export default function NotificationPreferenceCard({
  group, // string key (e.g. "leads_sales") — used to namespace i18n
  rows, // [{ event_type, channels, email, in_app }]
  getDisplayedEmail,
  onEmailChange,
  onMuteAll,
  onEnableAll,
  savedAt,
  savedPillMs,
}) {
  const t = useTranslations(`Dashboard.NotificationsPage.preferences.groups.${group}`);
  const tShared = useTranslations("Dashboard.NotificationsPage.preferences");

  // Compute "any email-capable row currently on" — drives the footer label.
  const { anyEmailOn, anyEmailRow } = useMemo(() => {
    let on = false;
    let exists = false;
    for (const r of rows) {
      if (r.channels !== "in_app_and_email") continue;
      exists = true;
      const value = getDisplayedEmail(r.event_type, r.email);
      if (value) {
        on = true;
        break;
      }
    }
    return { anyEmailOn: on, anyEmailRow: exists };
  }, [rows, getDisplayedEmail]);

  const now = Date.now();

  return (
    <section
      className={cn(
        "bg-surface rounded-[0.75em] border border-border-light",
        "shadow-xs",
      )}
    >
      {/* Header */}
      <header className="flex items-start gap-[1em] px-[1.5em] pt-[1.25em] pb-[0.75em] border-b border-border-light">
        <div className="flex-1 min-w-0 flex flex-col gap-[0.25em]">
          <h3 className="font-heading text-[1em] font-semibold text-text leading-[1.3]">
            {t("title")}
          </h3>
          <p className="text-[0.8125em] text-text-muted leading-[1.45] max-w-[42em]">
            {t("description")}
          </p>
        </div>

        {/* Column headers — line up with the Toggle widths in the rows */}
        <div className="shrink-0 flex items-center gap-[1.25em] pt-[0.25em]">
          <ColumnHeader label={tShared("inAppColumn")} />
          <ColumnHeader label={tShared("emailColumn")} />
        </div>
      </header>

      {/* Rows */}
      <div className="px-[1.5em] divide-y divide-border-light">
        {rows.map((row) => {
          const displayedEmail = getDisplayedEmail(row.event_type, row.email);
          const savedTimestamp = savedAt.get(row.event_type);
          const savedRecently = !!savedTimestamp && now - savedTimestamp < savedPillMs;
          return (
            <NotificationPreferenceRow
              key={row.event_type}
              eventType={row.event_type}
              channels={row.channels}
              email={displayedEmail}
              onEmailChange={(next) => onEmailChange(row.event_type, next)}
              savedRecently={savedRecently}
            />
          );
        })}
      </div>

      {/* Footer — Mute all / Enable all toggle */}
      {anyEmailRow && (
        <footer className="px-[1.5em] py-[0.875em] border-t border-border-light flex items-center justify-end">
          {anyEmailOn ? (
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => onMuteAll(group)}
            >
              <BellOff size="0.875em" strokeWidth={2} />
              {tShared("muteAllEmail")}
            </AppButton>
          ) : (
            <AppButton
              variant="ghost"
              size="sm"
              onClick={() => onEnableAll(group)}
            >
              <Bell size="0.875em" strokeWidth={2} />
              {tShared("enableAllEmail")}
            </AppButton>
          )}
        </footer>
      )}
    </section>
  );
}

function ColumnHeader({ label }) {
  return (
    <span className="w-[5.5em] text-center text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
      {label}
    </span>
  );
}
