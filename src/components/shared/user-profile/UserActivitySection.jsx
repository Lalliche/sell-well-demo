"use client";

/**
 * UserActivitySection — Activity-section renderer for any admin overlay that
 * displays a user. Companion to `UserProfileSection` + `UserAccountSection`.
 *
 * Renders different KPI grids per role:
 *   - sales_partner → active campaigns / leads submitted / conversion rate /
 *                     lifetime earnings / flag count
 *   - company       → campaigns total / leads received / escrow available /
 *                     lifetime commissions paid / flag count
 *
 * Pulls all values from `user.activity` (which `fetchUserById` composes from
 * `MOCK_LEADS` + `MOCK_PARTNER_LINKS` + `MOCK_WALLETS` + `MOCK_WALLET_TRANSACTIONS`).
 * If `user.activity` is missing, renders the "no activity" placeholder.
 *
 * Props:
 *   user    — row from `fetchUserById` (must include `activity`).
 *   locale  — current next-intl locale.
 *   labels  — caller-supplied translations. Required keys:
 *               noActivity, approvedCampaigns, leadsTotal, conversionRate,
 *               earningsTotal, campaignsTotal, leadsReceived, escrowAvailable,
 *               commissionsPaid, flagCount.
 */

import { Flag } from "lucide-react";
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

export default function UserActivitySection({ user, locale, labels }) {
  const activity = user?.activity;
  if (!activity) {
    return <p className="text-[0.875em] text-text-muted">{labels.noActivity}</p>;
  }

  const numFmt = new Intl.NumberFormat(locale === "fr" ? "fr-DZ" : "en-US");
  const currencyFmt = (n) =>
    `${numFmt.format(Math.round(Number(n) || 0))} DA`;

  const grid =
    user.role === "sales_partner" ? (
      <div className="grid grid-cols-2 gap-[1em]">
        <Field label={labels.approvedCampaigns} mono>
          {numFmt.format(activity.approved_campaigns)}
        </Field>
        <Field label={labels.leadsTotal} mono>
          {numFmt.format(activity.leads_total)}
        </Field>
        <Field label={labels.conversionRate} mono>
          {activity.leads_total === 0 ? "—" : `${activity.conversion_rate}%`}
        </Field>
        <Field label={labels.earningsTotal} mono>
          {currencyFmt(activity.earnings_total)}
        </Field>
        <Field label={labels.flagCount} mono>
          <span className={cn(activity.flag_count >= 3 && "text-status-rejected-text font-semibold")}>
            {numFmt.format(activity.flag_count)}
          </span>
        </Field>
      </div>
    ) : (
      <div className="grid grid-cols-2 gap-[1em]">
        <Field label={labels.campaignsTotal} mono>
          {numFmt.format(activity.campaigns_total)}
        </Field>
        <Field label={labels.leadsReceived} mono>
          {numFmt.format(activity.leads_received)}
        </Field>
        <Field label={labels.escrowAvailable} mono>
          {currencyFmt(activity.escrow_available)}
        </Field>
        <Field label={labels.commissionsPaid} mono>
          {currencyFmt(activity.commissions_paid)}
        </Field>
        <Field label={labels.flagCount} mono>
          <span className={cn(activity.flag_count >= 3 && "text-status-rejected-text font-semibold")}>
            {numFmt.format(activity.flag_count)}
          </span>
        </Field>
      </div>
    );

  return (
    <div className="flex flex-col gap-[1.5em]">
      {grid}
      {(activity.recent_flags ?? []).length > 0 && (
        <RecentFlagsList rows={activity.recent_flags} locale={locale} labels={labels} />
      )}
    </div>
  );
}

function RecentFlagsList({ rows, locale, labels }) {
  const dateFmt = (iso) =>
    iso
      ? new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
          year: "numeric", month: "short", day: "numeric",
        })
      : "—";

  return (
    <div className="flex flex-col gap-[0.625em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
        {labels.recentFlagsHeading}
      </span>
      <ul className="flex flex-col gap-[0.5em]">
        {rows.map((flag) => (
          <li
            key={flag.id}
            className="flex items-start gap-[0.625em] p-[0.75em] bg-bg-alt rounded-[0.5em] border border-border-light"
          >
            <Flag
              size="0.875em"
              strokeWidth={2}
              className="text-status-rejected-text shrink-0 mt-[0.1875em]"
            />
            <div className="flex flex-col gap-[0.25em] min-w-0">
              <p className="text-[0.8125em] text-text leading-normal">
                {flag.reason}
              </p>
              <span className="text-[0.6875em] font-mono tabular-nums text-text-muted">
                {dateFmt(flag.created_at)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
