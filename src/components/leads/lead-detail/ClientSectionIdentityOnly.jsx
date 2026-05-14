"use client";

/**
 * ClientSectionIdentityOnly — identity-only variant of ClientSection.
 *
 * Renders client name + company + phone + email as a `<dl>` grid, no
 * notes timeline. The company-side overlay needs notes in a SEPARATE
 * section (LeadNotesSplit, with partner-vs-company split) so we can't
 * reuse the partner-side `ClientSection` which embeds NotesTimeline
 * inline.
 *
 * This is a read-only view — the partner submitted these fields, the
 * company is reading them post-reservation.
 */

export default function ClientSectionIdentityOnly({ lead, t }) {
  return (
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
