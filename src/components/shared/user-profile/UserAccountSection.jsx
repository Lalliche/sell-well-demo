"use client";

/**
 * UserAccountSection — Account-section renderer for any admin overlay that
 * displays a user. Companion to `UserProfileSection`.
 *
 * Shows: email · role · signup date · application_status badge · email-
 * verified · suspended_at (when suspended) · prior admin review note.
 *
 * Props:
 *   user    — row from `fetchUserById` / `fetchVerifications` with at least
 *             { email, role, created_at, application_status,
 *               application_review_notes?, is_email_verified, is_suspended?,
 *               suspended_at? }.
 *   locale  — current next-intl locale ("en" | "fr").
 *   labels  — caller-supplied translations. Required keys:
 *               email, role, rolePartner, roleCompany, signupDate,
 *               applicationStatus, emailVerified, yes, no,
 *               suspendedAt, priorNote,
 *               statuses.{pending_review, approved, more_info_requested, rejected}
 *             `statuses` is a function: `labels.status(value)` returns the
 *             localized label for that application_status enum.
 *
 * Caller wires its i18n namespace → labels and reuses this component so the
 * Account-section rendering stays identical across surfaces.
 */

import { Mail, Calendar, Ban } from "lucide-react";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import { cn } from "@/lib/utils";

function Field({ label, children, mono = false }) {
  return (
    <div className="flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        {label}
      </span>
      <span className={cn("text-[0.875em] text-text", mono && "font-mono tabular-nums")}>
        {children ?? <span className="text-text-muted">—</span>}
      </span>
    </div>
  );
}

function formatDate(iso, locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function UserAccountSection({ user, locale, labels }) {
  if (!user) return null;
  const roleLabel = user.role === "sales_partner" ? labels.rolePartner : labels.roleCompany;

  return (
    <div className="flex flex-col gap-[1.25em]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
        <Field label={labels.email}>
          <span className="inline-flex items-center gap-[0.375em]">
            <Mail size="0.8125em" strokeWidth={1.75} className="text-text-muted" />
            {user.email}
          </span>
        </Field>
        <Field label={labels.role}>{roleLabel}</Field>
        <Field label={labels.signupDate}>
          <span className="inline-flex items-center gap-[0.375em]">
            <Calendar size="0.8125em" strokeWidth={1.75} className="text-text-muted" />
            {formatDate(user.created_at, locale)}
          </span>
        </Field>
        <Field label={labels.applicationStatus}>
          <StatusBadge
            status={user.application_status}
            label={labels.status(user.application_status)}
          />
        </Field>
        <Field label={labels.emailVerified}>
          {user.is_email_verified ? labels.yes : labels.no}
        </Field>
        {user.is_suspended && (
          <Field label={labels.suspendedAt}>
            <span className="inline-flex items-center gap-[0.375em] text-status-rejected-text">
              <Ban size="0.8125em" strokeWidth={1.75} />
              {formatDate(user.suspended_at, locale)}
            </span>
          </Field>
        )}
      </div>

      {user.application_review_notes && (
        <Field label={labels.priorNote}>
          <p className="text-[0.875em] text-text-secondary leading-[1.6] whitespace-pre-wrap bg-bg-alt rounded-[0.5em] p-[0.875em] border border-border-light">
            {user.application_review_notes}
          </p>
        </Field>
      )}
    </div>
  );
}
