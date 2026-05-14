"use client";

/**
 * LinkSection — full link URL pill (the canonical interaction surface),
 * link code, generation date, and an "Open in new tab" affordance.
 *
 * The CopyPill is the signature interaction (Stripe / Rewardful pattern):
 * monospaced URL in a tinted pill with a copy button that flips
 * `Copy → Copied ✓` for 1.5s. No toast — the button is the feedback.
 */

import { ExternalLink } from "lucide-react";
import CopyPill from "@/components/shared/forms/CopyPill";
import { formatShortDate } from "./partner-link-helpers";

export default function LinkSection({ link, locale, t }) {
  const fullUrl = `https://${link.url}`;
  return (
    <div className="flex flex-col gap-[1.25em]">
      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
          {t("link.urlLabel")}
        </span>
        <CopyPill
          value={fullUrl}
          labels={{
            copy: t("copy.copy"),
            copied: t("copy.copied"),
            toastSuccess: t("copy.toastSuccess"),
          }}
          size="md"
        />
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-[0.375em] text-[0.75em] font-medium text-accent-text hover:text-accent transition-colors"
        >
          <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {t("link.openInNewTab")}
        </a>
      </div>

      <dl className="grid grid-cols-2 gap-x-[1.5em] gap-y-[0.875em]">
        <Field label={t("link.code")} value={link.code} mono />
        <Field
          label={t("link.created")}
          value={formatShortDate(link.created_at, locale) ?? "—"}
        />
      </dl>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-[0.25em] min-w-0">
      <dt className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {label}
      </dt>
      <dd className={`text-[0.875em] font-semibold text-text ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
