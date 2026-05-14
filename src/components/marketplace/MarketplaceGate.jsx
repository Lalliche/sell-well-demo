"use client";

/**
 * MarketplaceGate — hard guard rendered in place of the marketplace
 * content when the user can't yet act on it.
 *
 * Two states (only sales partners — companies / admins always pass):
 *   1. Email not verified       → action-oriented (they can unblock)
 *   2. Admin not yet approved   → passive (admin must act)
 *
 * Within #2 there are two sub-tones based on `application_status`:
 *   - pending_review      → calm "we're reviewing", soft SLA line
 *   - more_info_requested → "admin needs more info" + show admin's note
 *
 * `rejected` is NOT handled here — those users hit RejectedScreen at the
 * AppShell level and never reach the dashboard chrome at all.
 *
 * Returns:
 *   { gated: false }                — render the marketplace
 *   { gated: true, node: ReactNode } — render this node instead
 *
 * Per the research: hard guard, content area only. Sidebar + top header
 * stay visible (caller is inside DashboardShell already). No blurred
 * underlying content — that's a paywall pattern, wrong tone for a
 * compliance review state.
 *
 * Visual: minimal, type-led. Small icon, heading, paragraph, optional
 * SLA, primary + secondary CTA. No illustration.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@/i18n/navigation";
import { Mail, Clock, AlertCircle } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { useAuth } from "@/components/providers/AuthProvider";
import { verifyEmail } from "@/lib/mock/auth";
import { cn } from "@/lib/utils";

/**
 * `useMarketplaceGate(user)` — returns the guard variant the user should
 * see, or `null` if they can pass through. Pure logic, separated from
 * the render so the parent can decide where to render the guard.
 */
export function useMarketplaceGate(user) {
  if (!user || user.role !== "sales_partner") return null;
  if (!user.is_email_verified) return { kind: "email" };
  if (user.application_status === "pending_review") return { kind: "pending_review" };
  if (user.application_status === "more_info_requested") return { kind: "more_info_requested" };
  return null;
}

export default function MarketplaceGate({ variant }) {
  if (!variant) return null;
  if (variant.kind === "email")               return <EmailGate />;
  if (variant.kind === "pending_review")      return <PendingReviewGate />;
  if (variant.kind === "more_info_requested") return <MoreInfoGate />;
  return null;
}

/* ── Shared shell ──────────────────────────────────────────────────── */

function GateShell({ icon, iconBg, iconColor, heading, body, slaLine, primary, secondary, note }) {
  return (
    <div className="flex items-center justify-center py-[3em]">
      <div className={cn(
        "w-full max-w-[32em] mx-auto",
        "bg-surface border border-border-light rounded-[0.75em] shadow-xs",
        "px-[2em] py-[2.5em]",
        "flex flex-col items-center text-center gap-[1em]",
      )}>
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex items-center justify-center w-[3em] h-[3em] rounded-full",
            iconBg,
          )}
        >
          <span className={iconColor}>{icon}</span>
        </span>

        <div className="flex flex-col gap-[0.5em]">
          <h2 className="font-heading text-[1.25em] font-semibold tracking-[-0.02em] text-text leading-[1.2]">
            {heading}
          </h2>
          <p className="text-[0.875em] text-text-secondary leading-[1.6] max-w-[28em] mx-auto">
            {body}
          </p>
          {slaLine && (
            <p className="text-[0.75em] text-text-muted leading-[1.4] mt-[0.125em]">
              {slaLine}
            </p>
          )}
        </div>

        {note && (
          <div className="w-full text-left bg-bg-alt border border-border-light rounded-[0.5em] p-[0.875em]">
            <span className="block text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold mb-[0.375em]">
              {note.label}
            </span>
            <p className="text-[0.8125em] text-text-secondary leading-[1.5]">
              {note.body}
            </p>
          </div>
        )}

        {(primary || secondary) && (
          <div className="flex items-center gap-[0.5em] flex-wrap justify-center mt-[0.5em]">
            {primary}
            {secondary}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Email-not-verified guard ──────────────────────────────────────── */

function EmailGate() {
  const t = useTranslations("Marketplace.gate.email");
  const { user } = useAuth();
  const [resent, setResent] = useState(false);

  const resendMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => setResent(true),
  });

  return (
    <GateShell
      icon={<Mail size="1.25em" strokeWidth={1.75} />}
      iconBg="bg-accent-light"
      iconColor="text-accent-text"
      heading={t("heading")}
      body={t("body", { email: user?.email ?? "" })}
      primary={
        <AppButton
          variant="primary"
          size="md"
          isLoading={resendMutation.isPending}
          disabled={resent}
          onClick={() => resendMutation.mutate({ email: user?.email })}
        >
          {resent ? t("resent") : t("resend")}
        </AppButton>
      }
      secondary={
        <Link
          href="/dashboard"
          className="text-[0.8125em] font-semibold text-text-secondary hover:text-text"
        >
          {t("back")}
        </Link>
      }
    />
  );
}

/* ── Admin-pending-review guard ────────────────────────────────────── */

function PendingReviewGate() {
  const t = useTranslations("Marketplace.gate.pendingReview");
  return (
    <GateShell
      icon={<Clock size="1.25em" strokeWidth={1.75} />}
      iconBg="bg-[var(--color-status-pending-bg)]"
      iconColor="text-[var(--color-status-pending-text)]"
      heading={t("heading")}
      body={t("body")}
      slaLine={t("sla")}
      primary={
        <a
          href="mailto:support@sellwell.dz"
          className={cn(
            "inline-flex items-center justify-center h-[2.5em] px-[1.125em] rounded-[0.5em]",
            "text-[0.8125em] font-semibold tracking-[-0.005em]",
            "bg-cta text-cta-text shadow-sm",
            "hover:bg-cta-hover hover:shadow-md",
            "transition-[background-color,box-shadow] duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
          )}
        >
          {t("contact")}
        </a>
      }
      secondary={
        <Link
          href="/dashboard"
          className="text-[0.8125em] font-semibold text-text-secondary hover:text-text"
        >
          {t("back")}
        </Link>
      }
    />
  );
}

/* ── Admin needs more info guard ───────────────────────────────────── */

function MoreInfoGate() {
  const t = useTranslations("Marketplace.gate.moreInfoRequested");
  const { user } = useAuth();
  const noteText = user?.application_review_notes ?? null;

  return (
    <GateShell
      icon={<AlertCircle size="1.25em" strokeWidth={1.75} />}
      iconBg="bg-[var(--color-status-pending-bg)]"
      iconColor="text-[var(--color-status-pending-text)]"
      heading={t("heading")}
      body={t("body")}
      note={noteText ? { label: t("noteLabel"), body: noteText } : null}
      primary={
        <Link
          href="/settings"
          className={cn(
            "inline-flex items-center justify-center h-[2.5em] px-[1.125em] rounded-[0.5em]",
            "text-[0.8125em] font-semibold tracking-[-0.005em]",
            "bg-cta text-cta-text shadow-sm",
            "hover:bg-cta-hover hover:shadow-md",
            "transition-[background-color,box-shadow] duration-150 ease-out",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
          )}
        >
          {t("editProfile")}
        </Link>
      }
      secondary={
        <a
          href="mailto:support@sellwell.dz"
          className="text-[0.8125em] font-semibold text-text-secondary hover:text-text"
        >
          {t("contact")}
        </a>
      }
    />
  );
}
