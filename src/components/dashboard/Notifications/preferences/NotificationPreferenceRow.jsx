"use client";

/**
 * One row inside a NotificationPreferenceCard.
 *
 * Layout:
 *   [ label + helper text  ─────────────  In-app | Email ]
 *
 * - In-app column is ALWAYS disabled in V1 ("Coming soon"). It shows the
 *   Toggle stuck in its default position with a small caption beneath.
 * - Email column behavior depends on the row's channels mode:
 *     in_app_and_email → live, writable toggle
 *     in_app_only      → disabled toggle with "No email" caption (the
 *                        spec says this event never sends email)
 *
 * The Saved pill is rendered at the column level when this row's
 * `event_type` is in the saved map within the active window. The card
 * passes `savedRecently` down; this row doesn't compute it.
 */

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Toggle from "@/components/ui/Toggle";
import { Check } from "lucide-react";

export default function NotificationPreferenceRow({
  eventType,
  channels, // "in_app_and_email" | "in_app_only"
  email,
  // in_app, // reserved for V2 when in-app muting wires up
  onEmailChange,
  savedRecently,
}) {
  const t = useTranslations(`Dashboard.NotificationsPage.preferences.events.${eventType}`);

  const emailDisabled = channels === "in_app_only";

  return (
    <div className="flex items-start gap-[1em] py-[0.875em]">
      {/* Label column — grows */}
      <div className="flex-1 min-w-0 flex flex-col gap-[0.25em]">
        <span className="text-[0.875em] font-medium text-text leading-[1.35]">
          {t("label")}
        </span>
        <span className="text-[0.75em] text-text-muted leading-[1.45] max-w-[42em]">
          {t("helper")}
        </span>
      </div>

      {/* Toggle columns — fixed widths so the cells line up across rows */}
      <div className="shrink-0 flex items-center gap-[1.25em]">
        {/* In-app — disabled in V1 */}
        <InAppCell />

        {/* Email — writable unless event is in-app-only */}
        <EmailCell
          eventType={eventType}
          email={email}
          disabled={emailDisabled}
          onChange={onEmailChange}
          savedRecently={savedRecently}
        />
      </div>
    </div>
  );
}

function InAppCell() {
  const t = useTranslations("Dashboard.NotificationsPage.preferences");
  return (
    <div className="w-[5.5em] flex flex-col items-center gap-[0.25em]">
      <Toggle
        checked
        onChange={() => {}}
        disabled
        size="sm"
        aria-label={t("inAppToggleLabel")}
      />
      <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
        {t("comingSoon")}
      </span>
    </div>
  );
}

function EmailCell({ eventType, email, disabled, onChange, savedRecently }) {
  const t = useTranslations("Dashboard.NotificationsPage.preferences");
  return (
    <div className="w-[5.5em] flex flex-col items-center gap-[0.25em]">
      <Toggle
        id={`pref-email-${eventType}`}
        checked={!!email && !disabled}
        onChange={(next) => onChange?.(next)}
        disabled={disabled}
        size="sm"
        aria-label={t("emailToggleLabel")}
      />
      {disabled ? (
        <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
          {t("noEmail")}
        </span>
      ) : (
        <span
          className={cn(
            "inline-flex items-center gap-[0.25em] text-[0.6875em] font-semibold uppercase tracking-[0.06em]",
            "transition-opacity duration-200 ease-out",
            savedRecently
              ? "text-[var(--color-trend-positive)] opacity-100"
              : "opacity-0 pointer-events-none",
          )}
          aria-live="polite"
        >
          <Check size="0.875em" strokeWidth={2.5} />
          {t("saved")}
        </span>
      )}
    </div>
  );
}
