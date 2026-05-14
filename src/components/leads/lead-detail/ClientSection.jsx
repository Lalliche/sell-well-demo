"use client";

/**
 * ClientSection — renders the partner's own client identity + the
 * append-only notes timeline inside the LeadDetailOverlay.
 *
 * Always fully visible. The escrow-spec's "contact info hidden until
 * reservation" rule is for the COMPANY-side inbox — partners typed this
 * data themselves and have nothing to hide from themselves.
 *
 * Notes are rendered in a dedicated component so the JSX here stays
 * scoped to identity + the bridge into the timeline.
 */

import NotesTimeline from "./NotesTimeline";

export default function ClientSection({ lead, locale, t }) {
  return (
    <div className="flex flex-col gap-[1.25em]">
      <dl className="grid grid-cols-2 gap-x-[1.5em] gap-y-[0.875em]">
        <Field label={t("client.name")} value={lead.client_full_name} />
        {lead.client_company_name && (
          <Field label={t("client.company")} value={lead.client_company_name} />
        )}
        <Field label={t("client.phone")} value={lead.client_phone} mono />
        <Field
          label={t("client.email")}
          value={lead.client_email ?? t("client.noEmail")}
          mono={!!lead.client_email}
        />
      </dl>

      <NotesTimeline lead={lead} locale={locale} t={t} />
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
