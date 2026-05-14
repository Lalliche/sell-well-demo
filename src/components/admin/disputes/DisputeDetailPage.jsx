"use client";

/**
 * DisputeDetailPage — admin /admin/disputes/[slug] route.
 *
 * Authority constraint (load-bearing): page returns 404 when the lead's
 * status is NOT in the admin-visible set (disputed_verifying,
 * expired_verifying, not_converted). `fetchDisputeBySlug` enforces this
 * server-side; this page just renders the NotFound shell when the fetch
 * resolves to null. Partners or companies deep-linking get the same
 * NotFound — no data leak.
 *
 * Action gating: the three resolution buttons render ONLY when status is
 * `disputed_verifying` or `expired_verifying`. On `not_converted` the page
 * is read-only history.
 *
 * Layout — 2-column desktop, 1-column mobile:
 *   left (8/12):
 *     - DisputeHeader (back link · client name · status badge · key facts)
 *     - LeadFactsCard
 *     - PartiesGrid (partner card + company card)
 *     - ClientContactCard
 *     - OutreachLog (LeadVerification list)
 *   right (4/12, sticky):
 *     - ActionRail
 *         - Reservation snapshot (commission + platform fee = total reserved)
 *         - Footer state machine: 4 action buttons (Contact / Rule sale /
 *           Rule no sale / Needs investigation) — or read-only chip on
 *           not_converted
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  ArrowLeft, AlertTriangle, Building2, User as UserIcon, Mail, Phone,
  ShieldCheck, FileText, Flag, ExternalLink,
  CheckCircle2, XCircle, MessageSquare,
} from "lucide-react";

import { Link, useRouter } from "@/i18n/navigation";
import PageHeader from "@/components/shared/layout/PageHeader";
import AppButton from "@/components/ui/Buttons";
import Avatar from "@/components/shared/data-display/Avatar";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import TimelineStep from "@/components/shared/data-display/timeline/TimelineStep";
import { useToast } from "@/hooks/useToast";
import { format } from "@/lib/format/currency";
import { cn } from "@/lib/utils";
import {
  fetchDisputeBySlug,
  fetchVerificationsForLead,
  logOutreach,
  resolveDispute,
} from "@/lib/mock/admin";

import ContactClientDialog from "./dialogs/ContactClientDialog";
import RuleDialog from "./dialogs/RuleDialog";

/* ── Helpers ──────────────────────────────────────────────────────────── */

const RESOLVABLE = ["disputed_verifying", "expired_verifying"];

function formatDate(iso, locale) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(locale === "fr" ? "fr-DZ" : "en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Field({ label, children, mono = false }) {
  return (
    <div className="flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        {label}
      </span>
      <span className={cn("text-[0.875em] text-text break-words", mono && "font-mono tabular-nums")}>
        {children ?? <span className="text-text-muted">—</span>}
      </span>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function DisputeDetailPage({ slug }) {
  const t = useTranslations("Admin.disputes");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: dispute, isLoading } = useQuery({
    queryKey: ["admin", "disputes", { slug }],
    queryFn: () => fetchDisputeBySlug(slug),
  });

  const { data: verifications = [] } = useQuery({
    queryKey: ["admin", "disputes", "verifications", { slug }],
    queryFn: () => fetchVerificationsForLead(slug),
    enabled: !!dispute,
  });

  // Which dialog is open
  const [dialogKind, setDialogKind] = useState(null);
    // null | "contact" | "rule_sale" | "rule_no_sale"

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
  };

  const contactMut = useMutation({
    mutationFn: ({ method, result, notes }) =>
      logOutreach(slug, { method, result, notes }),
    onSuccess: (row) => {
      if (!row) return toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
      invalidateAll();
      toast.success(t("toasts.contactSuccessBody"), { title: t("toasts.contactSuccessTitle") });
    },
  });

  const ruleMut = useMutation({
    mutationFn: ({ ruling, admin_notes }) =>
      resolveDispute(slug, { ruling, admin_notes }),
    onSuccess: (result, vars) => {
      if (!result) return toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
      invalidateAll();
      const isSale = vars.ruling === "sale_happened";
      toast.success(
        t(isSale ? "toasts.ruleSaleBody" : "toasts.ruleNoSaleBody"),
        { title: t(isSale ? "toasts.ruleSaleTitle" : "toasts.ruleNoSaleTitle") },
      );
    },
  });

  /* ── Loading / not-found ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em] animate-pulse">
        <div className="h-[2em] w-[12em] bg-border-light rounded-[0.5em]" />
        <div className="h-[16em] bg-surface border border-border-light rounded-[0.625em]" />
      </div>
    );
  }
  if (!dispute) {
    return (
      <div className="px-[2em] py-[2em] flex flex-col gap-[1em]">
        <PageHeader title={t("notFound.title")} description={t("notFound.body")} />
        <div className="bg-surface border border-border-light rounded-[0.625em] p-[2em] flex flex-col items-center gap-[1em] text-center max-w-[40em]">
          <AlertTriangle size="2em" strokeWidth={1.5} className="text-text-muted" />
          <p className="text-[0.875em] text-text-secondary max-w-[28em] leading-[1.55]">
            {t("notFound.body")}
          </p>
          <AppButton variant="primary" onClick={() => router.push("/admin/disputes")}>
            <span className="inline-flex items-center gap-[0.375em]">
              <ArrowLeft size="0.875em" strokeWidth={1.75} />
              {t("notFound.backCta")}
            </span>
          </AppButton>
        </div>
      </div>
    );
  }

  const canResolve = RESOLVABLE.includes(dispute.status);
  const isResolved = dispute.status === "not_converted";

  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.5em]">
      {/* Back link */}
      <Link
        href="/admin/disputes"
        className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-secondary hover:text-text w-fit transition-[color] duration-150"
      >
        <ArrowLeft size="0.875em" strokeWidth={1.75} />
        {t("backToQueue")}
      </Link>

      {/* Header — name + status */}
      <div className="flex items-start justify-between gap-[1em] flex-wrap">
        <div className="flex items-center gap-[0.75em]">
          <Avatar name={dispute.client_full_name} size="lg" />
          <div className="flex flex-col gap-[0.125em]">
            <h1 className="font-heading font-bold text-[1.5em] tracking-[-0.02em] text-text leading-[1.15]">
              {dispute.client_full_name}
            </h1>
            <span className="text-[0.875em] text-text-secondary">
              {t("disputeFor", { campaign: dispute.campaign_name ?? "—" })}
            </span>
          </div>
        </div>
        <StatusBadge status={dispute.status} label={t(`statuses.${dispute.status}`)} />
      </div>

      {/* 2-col body */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-[1.5em] max-w-[88em]">

        {/* ── LEFT ───────────────────────────────────────────────── */}
        <div className="xl:col-span-8 flex flex-col gap-[1.25em]">

          {/* Lead facts */}
          <section className="bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[1.5em] flex flex-col gap-[1em]">
            <header className="flex items-center gap-[0.5em]">
              <FileText size="1em" strokeWidth={1.75} className="text-text-muted" />
              <h2 className="text-[1em] font-semibold font-body text-text">
                {t("lead.heading")}
              </h2>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
              <Field label={t("lead.campaign")}>{dispute.campaign_name}</Field>
              <Field label={t("lead.tier")}>
                {dispute.pricing_tier_resolved?.name ?? "—"}
              </Field>
              <Field label={t("lead.submitted")} mono>
                {formatDate(dispute.submitted_at, locale)}
              </Field>
              <Field label={t("lead.acknowledged")} mono>
                {formatDate(dispute.acknowledged_at, locale)}
              </Field>
              <Field label={t("lead.trackingExpiresAt")} mono>
                {formatDate(dispute.tracking_window_expires_at, locale)}
              </Field>
              <Field label={t("lead.daysWaiting")} mono>
                {dispute.days_waiting === 0 ? "<1d" : `${dispute.days_waiting}d`}
              </Field>
            </div>
            {dispute.denial_reason && (
              <div className="flex flex-col gap-[0.375em] p-[1em] bg-status-rejected-bg/40 border border-status-rejected-text/20 rounded-[0.5em]">
                <span className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-status-rejected-text font-body">
                  {t("lead.denialReason")}
                </span>
                <p className="text-[0.875em] text-text leading-[1.55] whitespace-pre-wrap">
                  {dispute.denial_reason}
                </p>
              </div>
            )}
          </section>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
            <PartnerCard partner={dispute.partner} t={t} />
            <CompanyCard company={dispute.company} t={t} />
          </div>

          {/* Client contact */}
          <ClientContactCard dispute={dispute} t={t} />

          {/* Outreach log */}
          <OutreachLog verifications={verifications} t={t} locale={locale} />
        </div>

        {/* ── RIGHT (sticky action rail) ─────────────────────────── */}
        <aside className="xl:col-span-4">
          <div className="xl:sticky xl:top-[1.5em] flex flex-col gap-[1em]">
            <ActionRail
              dispute={dispute}
              canResolve={canResolve}
              isResolved={isResolved}
              onContact={() => setDialogKind("contact")}
              onRuleSale={() => setDialogKind("rule_sale")}
              onRuleNoSale={() => setDialogKind("rule_no_sale")}
              isSubmitting={contactMut.isPending || ruleMut.isPending}
              t={t}
            />
          </div>
        </aside>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <ContactClientDialog
        open={dialogKind === "contact"}
        onCancel={() => setDialogKind(null)}
        onConfirm={(payload) => {
          setDialogKind(null);
          contactMut.mutate(payload);
        }}
      />
      <RuleDialog
        kind="sale_happened"
        open={dialogKind === "rule_sale"}
        onCancel={() => setDialogKind(null)}
        onConfirm={(notes) => {
          setDialogKind(null);
          ruleMut.mutate({ ruling: "sale_happened", admin_notes: notes });
        }}
        clientName={dispute.client_full_name}
        commissionAmount={dispute.commission_amount}
      />
      <RuleDialog
        kind="no_sale"
        open={dialogKind === "rule_no_sale"}
        onCancel={() => setDialogKind(null)}
        onConfirm={(notes) => {
          setDialogKind(null);
          ruleMut.mutate({ ruling: "no_sale", admin_notes: notes });
        }}
        clientName={dispute.client_full_name}
        commissionAmount={dispute.commission_amount}
      />
    </div>
  );
}

/* ── Subcomponents ────────────────────────────────────────────────────── */

function PartnerCard({ partner, t }) {
  if (!partner) return <div className="bg-surface border border-border-light rounded-[0.625em] p-[1em] text-[0.8125em] text-text-muted">—</div>;
  return (
    <section className="bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[1.25em] flex flex-col gap-[0.875em]">
      <header className="flex items-center gap-[0.5em]">
        <UserIcon size="0.9375em" strokeWidth={1.75} className="text-text-muted" />
        <h3 className="text-[0.8125em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
          {t("parties.partner")}
        </h3>
      </header>
      <div className="flex items-center gap-[0.75em]">
        {partner.profile_photo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={partner.profile_photo}
            alt={`${partner.first_name} ${partner.last_name}`}
            className="w-[2.5em] h-[2.5em] rounded-[0.5em] object-cover border border-border-light"
          />
        ) : (
          <Avatar name={`${partner.first_name} ${partner.last_name}`} size="md" />
        )}
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.9375em] font-semibold text-text">
            {partner.first_name} {partner.last_name}
          </span>
          {partner.email && (
            <span className="inline-flex items-center gap-[0.25em] text-[0.75em] text-text-muted">
              <Mail size="0.6875em" strokeWidth={1.75} />
              {partner.email}
            </span>
          )}
        </div>
      </div>
      {partner.flag_count > 0 && (
        <div className="inline-flex items-center gap-[0.375em] text-[0.75em] text-status-rejected-text">
          <Flag size="0.75em" strokeWidth={1.75} />
          {t("parties.flagCount", { count: partner.flag_count })}
        </div>
      )}
    </section>
  );
}

function CompanyCard({ company, t }) {
  if (!company) return <div className="bg-surface border border-border-light rounded-[0.625em] p-[1em] text-[0.8125em] text-text-muted">—</div>;
  return (
    <section className="bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[1.25em] flex flex-col gap-[0.875em]">
      <header className="flex items-center gap-[0.5em]">
        <Building2 size="0.9375em" strokeWidth={1.75} className="text-text-muted" />
        <h3 className="text-[0.8125em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
          {t("parties.company")}
        </h3>
      </header>
      <div className="flex items-center gap-[0.75em]">
        {company.logo ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={company.logo}
            alt={company.company_name}
            className="w-[2.5em] h-[2.5em] rounded-[0.5em] object-cover border border-border-light bg-bg"
          />
        ) : (
          <Avatar name={company.company_name} size="md" />
        )}
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.9375em] font-semibold text-text">
            {company.company_name}
          </span>
          {company.email && (
            <span className="inline-flex items-center gap-[0.25em] text-[0.75em] text-text-muted">
              <Mail size="0.6875em" strokeWidth={1.75} />
              {company.email}
            </span>
          )}
        </div>
      </div>
      {company.flag_count > 0 && (
        <div className="inline-flex items-center gap-[0.375em] text-[0.75em] text-status-rejected-text">
          <Flag size="0.75em" strokeWidth={1.75} />
          {t("parties.flagCount", { count: company.flag_count })}
        </div>
      )}
    </section>
  );
}

function ClientContactCard({ dispute, t }) {
  return (
    <section className="bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[1.5em] flex flex-col gap-[1em]">
      <header className="flex items-center gap-[0.5em]">
        <Phone size="1em" strokeWidth={1.75} className="text-text-muted" />
        <h2 className="text-[1em] font-semibold font-body text-text">
          {t("client.heading")}
        </h2>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
        <Field label={t("client.fullName")}>{dispute.client_full_name}</Field>
        <Field label={t("client.companyName")}>{dispute.client_company_name}</Field>
        <Field label={t("client.phone")} mono>
          {dispute.client_phone ? (
            <a href={`tel:${dispute.client_phone}`} className="text-accent hover:underline">
              {dispute.client_phone}
            </a>
          ) : null}
        </Field>
        <Field label={t("client.email")}>
          {dispute.client_email ? (
            <a href={`mailto:${dispute.client_email}`} className="text-accent hover:underline inline-flex items-center gap-[0.25em]">
              {dispute.client_email}
              <ExternalLink size="0.6875em" strokeWidth={1.75} />
            </a>
          ) : null}
        </Field>
      </div>
    </section>
  );
}

function OutreachLog({ verifications, t, locale }) {
  return (
    <section className="bg-surface border border-border-light rounded-[0.625em] shadow-xs p-[1.5em] flex flex-col gap-[1em]">
      <header className="flex items-center justify-between gap-[0.5em]">
        <div className="flex items-center gap-[0.5em]">
          <ShieldCheck size="1em" strokeWidth={1.75} className="text-text-muted" />
          <h2 className="text-[1em] font-semibold font-body text-text">
            {t("outreach.heading")}
          </h2>
        </div>
        <span className="text-[0.75em] text-text-muted">
          {t("outreach.count", { count: verifications.length })}
        </span>
      </header>

      {verifications.length === 0 ? (
        <p className="text-[0.8125em] text-text-muted py-[1em]">
          {t("outreach.empty")}
        </p>
      ) : (
        <ol className="flex flex-col gap-[1em]">
          {verifications.map((v, i) => {
            const state =
              v.result === "reached_confirmed_sale" ? "approved"
              : v.result === "reached_no_sale"       ? "rejected"
              : v.result === "no_answer"             ? "warning"
              : "current";
            const title = t(`outreach.method.${v.outreach_method}`) + " · " + t(`outreach.result.${v.result}`);
            return (
              <TimelineStep
                key={v.id}
                step={{
                  title,
                  body: v.admin_notes ?? "",
                  timestamp:
                    v.outreach_date
                      ? new Date(v.outreach_date).toLocaleString(locale === "fr" ? "fr-DZ" : "en-US", {
                          year: "numeric", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : null,
                  state,
                }}
                isLast={i === verifications.length - 1}
              />
            );
          })}
        </ol>
      )}
    </section>
  );
}

function ActionRail({
  dispute, canResolve, isResolved,
  onContact, onRuleSale, onRuleNoSale,
  isSubmitting, t,
}) {
  return (
    <section className="bg-surface border border-border-light rounded-[0.625em] shadow-sm p-[1.5em] flex flex-col gap-[1.25em]">
      {/* Reservation snapshot */}
      <div className="flex flex-col gap-[0.5em]">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-text-muted font-body">
          {t("rail.reservation")}
        </span>
        <div className="flex flex-col gap-[0.375em]">
          <RailLine label={t("rail.commission")} value={format(dispute.commission_amount)} />
          <RailLine label={t("rail.platformFee")} value={format(dispute.platform_fee_amount)} />
          <div className="h-px bg-border-light my-[0.25em]" />
          <RailLine
            label={t("rail.totalReserved")}
            value={format(dispute.total_reservation)}
            emphasize
          />
        </div>
      </div>

      {/* Action stack — visual hierarchy:
       *   1) Add note (secondary, precursor): any audit entry against this
       *      dispute — outreach attempt, internal hunch, escalation memo.
       *      Appends a `LeadVerification` row but does NOT resolve the
       *      lead. Sits at top so admin's eye lands on it first.
       *   2) Section divider — sets the rulings apart visually as a
       *      distinct, more-final decision.
       *   3) Sale happened / No sale (2-col grid). The two mutually-
       *      exclusive money-moving outcomes, differentiated by semantic
       *      tint + icon. Status-tinted secondaries (green for confirm-sale,
       *      red for no-sale). NOT solid-black slabs (too heavy + reads as
       *      two competing primary CTAs); NOT accent-blue (design system
       *      §Buttons reserves blue for links and data, not buttons). */}
      {canResolve ? (
        <div className="flex flex-col gap-[1em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-text-muted font-body">
            {t("rail.actions")}
          </span>

          {/* Precursor: log any audit-trail entry (outreach, internal note) */}
          <AppButton
            variant="secondary"
            size="md"
            onClick={onContact}
            disabled={isSubmitting}
            className="w-full"
          >
            <span className="inline-flex items-center gap-[0.5em]">
              <MessageSquare size="0.9375em" strokeWidth={1.75} />
              {t("actions.addNote")}
            </span>
          </AppButton>

          {/* Visual break: the two rulings are a different decision class */}
          <div className="h-px bg-border-light" />

          {/* The two decisive rulings — paired side-by-side. */}
          <div className="grid grid-cols-2 gap-[0.5em]">
            <button
              type="button"
              onClick={onRuleSale}
              disabled={isSubmitting}
              className={cn(
                "inline-flex items-center justify-center gap-[0.4em] h-[2.5em] px-[1em] rounded-[0.5em]",
                "text-[0.875em] font-semibold font-body",
                "bg-status-approved-bg text-trend-positive",
                "border border-trend-positive/20",
                "hover:bg-status-approved-bg/70 hover:-translate-y-px hover:border-trend-positive/40 hover:shadow-xs",
                "active:translate-y-0 active:bg-status-approved-bg",
                "transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trend-positive/30",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
              )}
            >
              <CheckCircle2 size="0.9375em" strokeWidth={1.75} />
              {t("actions.ruleSaleShort")}
            </button>
            <button
              type="button"
              onClick={onRuleNoSale}
              disabled={isSubmitting}
              className={cn(
                "inline-flex items-center justify-center gap-[0.4em] h-[2.5em] px-[1em] rounded-[0.5em]",
                "text-[0.875em] font-semibold font-body",
                "bg-status-rejected-bg text-trend-negative",
                "border border-trend-negative/20",
                "hover:bg-status-rejected-bg/70 hover:-translate-y-px hover:border-trend-negative/40 hover:shadow-xs",
                "active:translate-y-0 active:bg-status-rejected-bg",
                "transition-[background-color,border-color,transform,box-shadow] duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trend-negative/30",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
              )}
            >
              <XCircle size="0.9375em" strokeWidth={1.75} />
              {t("actions.ruleNoSaleShort")}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-[0.5em] p-[1em] bg-bg-alt rounded-[0.5em] border border-border-light">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-text-muted font-body">
            {t("rail.statusLabel")}
          </span>
          <p className="text-[0.8125em] text-text-secondary leading-normal">
            {isResolved ? t("rail.readOnlyResolved") : t("rail.readOnly")}
          </p>
        </div>
      )}
    </section>
  );
}

function RailLine({ label, value, emphasize = false }) {
  return (
    <div className="flex items-baseline justify-between gap-[0.5em]">
      <span className="text-[0.8125em] text-text-secondary">{label}</span>
      <span className={cn(
        "font-mono tabular-nums",
        emphasize ? "text-[1em] font-semibold text-text" : "text-[0.875em] text-text-secondary",
      )}>
        {value}
      </span>
    </div>
  );
}
