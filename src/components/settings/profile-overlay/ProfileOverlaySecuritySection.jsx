"use client";

/**
 * ProfileOverlaySecuritySection — Security section of the Profile detail
 * overlay (Phase 6/7 settings refactor 2026-05-13).
 *
 * Read-only summary card. Real password change ships when the backend
 * lands in Phase 11 — until then we show:
 *   - Email + verified-status badge
 *   - Account creation date
 *   - "Change password" CTA disabled with a tooltip explaining that V1
 *     password resets go through `/forgot-password` (admin-triggered).
 *
 * Keeps the section honest — no fake save handlers, no theater.
 */

import { useTranslations, useLocale } from "next-intl";
import { Mail, Calendar, Lock, ShieldCheck, ShieldAlert } from "lucide-react";

import AppButton from "@/components/ui/Buttons";
import { cn } from "@/lib/utils";

export default function ProfileOverlaySecuritySection({ user }) {
  const t = useTranslations("Profile.security");
  const locale = useLocale();

  if (!user) {
    return <p className="text-[0.875em] text-text-muted">{t("loading")}</p>;
  }

  const formatDate = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-[1.25em]">
      {/* Email + verified badge */}
      <Field icon={Mail} label={t("email")}>
        <span className="inline-flex items-center gap-[0.5em] flex-wrap">
          <span className="font-mono text-[0.875em]">{user.email}</span>
          {user.is_email_verified ? (
            <span className="inline-flex items-center gap-[0.25em] text-[0.6875em] font-semibold uppercase tracking-wider bg-status-approved-bg text-status-approved-text px-[0.5em] py-[0.125em] rounded-[0.375em]">
              <ShieldCheck size="0.75em" strokeWidth={2} />
              {t("verified")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[0.25em] text-[0.6875em] font-semibold uppercase tracking-wider bg-status-pending-bg text-status-pending-text px-[0.5em] py-[0.125em] rounded-[0.375em]">
              <ShieldAlert size="0.75em" strokeWidth={2} />
              {t("notVerified")}
            </span>
          )}
        </span>
      </Field>

      <Field icon={Calendar} label={t("memberSince")}>
        {formatDate(user.created_at)}
      </Field>

      {/* Change password — V1: disabled, deferred to backend */}
      <div className="flex flex-col gap-[0.5em] pt-[0.5em] border-t border-border-light">
        <div className="flex items-center gap-[0.5em]">
          <Lock size="0.9375em" strokeWidth={1.75} className="text-text-muted" />
          <span className="text-[0.875em] font-semibold text-text">
            {t("password")}
          </span>
        </div>
        <p className="text-[0.75em] text-text-muted leading-normal">
          {t("passwordHelp")}
        </p>
        <div className="pt-[0.25em]">
          <AppButton variant="secondary" size="md" disabled>
            {t("actions.changePassword")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-wider text-text-muted font-body">
        {label}
      </span>
      <span className={cn("text-[0.875em] text-text inline-flex items-center gap-[0.5em]")}>
        <Icon size="0.875em" strokeWidth={1.75} className="text-text-muted shrink-0" />
        {children}
      </span>
    </div>
  );
}
