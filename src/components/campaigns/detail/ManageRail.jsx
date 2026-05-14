"use client";

/**
 * ManageRail — sticky right rail on /campaigns/[slug] (company side).
 *
 * Anatomy (top → bottom):
 *   1. Headline commission line ("10% commission" / "5,000 DA per sale")
 *   2. KPI mini-grid: Active partners · Leads · Conversion rate · Revenue
 *   3. Action stack:
 *        - Edit campaign        (always shown; opens CampaignEditOverlay)
 *        - Pause / Resume       (driven by campaign.status; ConfirmDialog
 *                                 for both — pause is reversible but
 *                                 visible to partners, resume re-publishes)
 *        - Close campaign       (destructive, ConfirmDialog with reason)
 *   4. Tracking-window line + Partner Links pill (if enabled).
 *
 * Verification gate: when `actionsDisabled` is true (company in
 * pending_review / unverified email), Pause/Resume/Close confirms are
 * disabled. Edit stays clickable so the company can keep prepping
 * content while waiting on admin review.
 *
 * Mutations route through the campaigns mock layer; React Query keys
 * for ["campaign", slug] and ["campaigns", { companyId }] are
 * invalidated on success so the list page + detail page both refresh.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Clock,
  Link2,
  Pencil,
  Pause,
  Play,
  X as XIcon,
  Users,
  Inbox,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import { useToast } from "@/hooks/useToast";
import {
  pauseCampaign,
  resumeCampaign,
  closeCampaign,
} from "@/lib/mock/campaigns";
import { format as formatDZD, formatNumber } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function ManageRail({ campaign, actionsDisabled, onEditClick }) {
  const t = useTranslations("Campaigns.companyDetail.rail");
  const tConfirm = useTranslations("Campaigns.companyDetail.confirm");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState(null); // null | "pause" | "resume" | "close"

  const commissionLine =
    campaign.commission_type === "percentage"
      ? t("pctCommission", { value: campaign.commission_value })
      : t("flatCommission", { value: formatDZD(campaign.commission_value) });

  const invalidateCampaign = () => {
    queryClient.invalidateQueries({ queryKey: ["campaign", campaign.slug] });
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  const mutation = useMutation({
    mutationFn: async ({ kind }) => {
      if (kind === "pause") return pauseCampaign(campaign.id);
      if (kind === "resume") return resumeCampaign(campaign.id);
      if (kind === "close") return closeCampaign(campaign.id);
      return null;
    },
    onSuccess: (_data, vars) => {
      invalidateCampaign();
      const key = vars.kind; // pause | resume | close
      toast.success(tConfirm(`success.${key}`));
      setConfirm(null);
    },
    onError: () => {
      toast.error(tConfirm("errorBody"), { title: tConfirm("errorTitle") });
    },
  });

  const isLive = campaign.status === "active" || campaign.status === "paused";
  const isClosed = campaign.status === "closed";

  return (
    <div className="flex flex-col gap-[1em] p-[1.25em] bg-surface border border-border-light rounded-[0.75em] shadow-sm">
      {/* Headline commission */}
      <div className="flex flex-col gap-[0.125em]">
        <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
          {t("commissionHeadline")}
        </span>
        <span className="font-mono text-[1.5em] font-semibold text-accent leading-tight">
          {commissionLine}
        </span>
      </div>

      <div className="h-[1px] bg-border-light" />

      {/* KPI mini-grid — 2x2 */}
      <ul className="grid grid-cols-2 gap-[0.5em]">
        <KpiTile
          icon={Users}
          label={t("kpi.partners")}
          value={formatNumber(campaign.active_partners_count)}
        />
        <KpiTile
          icon={Inbox}
          label={t("kpi.leads")}
          value={formatNumber(campaign.leads_count)}
        />
        <KpiTile
          icon={TrendingUp}
          label={t("kpi.conversionRate")}
          value={`${campaign.conversion_rate}%`}
          accent={campaign.conversion_rate > 0}
        />
        <KpiTile
          icon={CircleDollarSign}
          label={t("kpi.revenue")}
          value={formatDZD(campaign.revenue_total ?? 0, { withSymbol: false })}
          mono
        />
      </ul>

      <div className="h-[1px] bg-border-light" />

      {/* Action stack */}
      <div className="flex flex-col gap-[0.5em]">
        <AppButton
          variant="primary"
          size="md"
          className="w-full"
          onClick={onEditClick}
        >
          <span className="inline-flex items-center justify-center gap-[0.5em]">
            <Pencil className="w-[1em] h-[1em]" strokeWidth={1.75} />
            {t("actions.edit")}
          </span>
        </AppButton>

        {!isClosed && (
          <AppButton
            variant="secondary"
            size="md"
            className="w-full"
            disabled={actionsDisabled || mutation.isPending}
            onClick={() =>
              setConfirm(campaign.status === "active" ? "pause" : "resume")
            }
          >
            <span className="inline-flex items-center justify-center gap-[0.5em]">
              {campaign.status === "active" ? (
                <Pause className="w-[1em] h-[1em]" strokeWidth={1.75} />
              ) : (
                <Play className="w-[1em] h-[1em]" strokeWidth={1.75} />
              )}
              {campaign.status === "active"
                ? t("actions.pause")
                : t("actions.resume")}
            </span>
          </AppButton>
        )}

        {!isClosed && (
          <button
            type="button"
            disabled={actionsDisabled || mutation.isPending}
            onClick={() => setConfirm("close")}
            className={cn(
              "h-[2.5em] inline-flex items-center justify-center gap-[0.5em] rounded-[0.5em]",
              "text-[0.875em] font-semibold text-status-rejected-text",
              "hover:bg-status-rejected-bg transition-[background-color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-rejected-text/30",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
            )}
          >
            <XIcon className="w-[1em] h-[1em]" strokeWidth={1.75} />
            {t("actions.close")}
          </button>
        )}
      </div>

      <div className="h-[1px] bg-border-light" />

      {/* Inline meta */}
      <div className="flex flex-col gap-[0.5em]">
        <MetaRow
          icon={Clock}
          label={t("meta.trackingWindow")}
          value={t("meta.trackingWindowValue", {
            days: campaign.tracking_window_days,
          })}
        />
        {campaign.partner_links_enabled && (
          <MetaRow
            icon={Link2}
            label={t("meta.partnerLinks")}
            value={t("meta.partnerLinksOn")}
          />
        )}
      </div>

      {/* Confirm dialogs — one mount, key-driven so the same primitive
          handles all three transitions. */}
      <ConfirmDialog
        open={confirm === "pause"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => mutation.mutate({ kind: "pause" })}
        title={tConfirm("pause.title")}
        description={tConfirm("pause.description")}
        confirmLabel={tConfirm("pause.confirm")}
        cancelLabel={tConfirm("cancel")}
      />
      <ConfirmDialog
        open={confirm === "resume"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => mutation.mutate({ kind: "resume" })}
        title={tConfirm("resume.title")}
        description={tConfirm("resume.description")}
        confirmLabel={tConfirm("resume.confirm")}
        cancelLabel={tConfirm("cancel")}
      />
      <ConfirmDialog
        open={confirm === "close"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => mutation.mutate({ kind: "close" })}
        title={tConfirm("close.title")}
        description={tConfirm("close.description")}
        confirmLabel={tConfirm("close.confirm")}
        cancelLabel={tConfirm("cancel")}
        destructive
      />
    </div>
  );
}

function KpiTile({ icon: Icon, label, value, accent, mono }) {
  return (
    <li className="flex flex-col gap-[0.25em] p-[0.625em] rounded-[0.5em] bg-bg-alt">
      <div className="flex items-center gap-[0.375em] text-text-muted">
        <Icon className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
        <span className="text-[0.6875em] uppercase tracking-[0.06em] font-semibold">
          {label}
        </span>
      </div>
      <span
        className={cn(
          "font-mono text-[1em] font-semibold tabular-nums",
          accent ? "text-accent" : "text-text",
        )}
      >
        {value}
      </span>
    </li>
  );
}

function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-[0.5em] text-[0.8125em]">
      <Icon className="w-[1em] h-[1em] text-text-muted shrink-0" strokeWidth={1.5} />
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium ms-auto">{value}</span>
    </div>
  );
}
