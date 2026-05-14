"use client";

/**
 * CompanyApplicationDetailOverlay — company-side wrapper around
 * `DetailOverlay`, scoped to a single CampaignApplication.
 *
 * Sections (mirror partner-side cadence; company-relevant content):
 *   1. Pitch    — the partner's pitch (reused from partner-side).
 *   2. Partner  — partner profile snapshot (avatar + bio + categories + skills).
 *   3. Timeline — same status timeline as partner-side.
 *
 * Footer — state-driven:
 *   - status === "pending"  → Approve (primary) + Reject (ghost) buttons.
 *     Verification gate disables both with a tooltip when the company
 *     is pending review or has an unverified email; pitch + partner +
 *     timeline stay viewable so the company can read while waiting.
 *   - status === "approved" → "Approved <relative-date>" pill.
 *   - status === "rejected" → "Rejected <relative-date>" pill + the
 *     stored review_reason rendered below.
 *
 * Reject opens a `ConfirmDialog` with `requireReason` so the partner
 * sees a real reason on their side. Approve fires immediately.
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Activity, User, Check, X as XIcon } from "lucide-react";
import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import AppButton from "@/components/ui/Buttons";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import PitchSection from "./application-detail/PitchSection";
import TimelineSection from "./application-detail/TimelineSection";
import PartnerSection from "./application-detail/PartnerSection";
import { reviewApplication } from "@/lib/mock/campaigns";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/hooks/useToast";
import { formatRelative } from "@/lib/format/relative-time";

export default function CompanyApplicationDetailOverlay({ open, onClose, application }) {
  const t = useTranslations("Applications.companyDetail");
  const tDetail = useTranslations("Applications.detail");
  const tTime = useTranslations("Applications.time");
  const locale = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [confirmReject, setConfirmReject] = useState(false);

  const actionsDisabled =
    user?.role === "company" &&
    (user?.application_status !== "approved" || user?.is_email_verified === false);

  const mutation = useMutation({
    mutationFn: (vars) => reviewApplication(application?.id, vars),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["company-applications"] });
      queryClient.invalidateQueries({ queryKey: ["campaign"] });
      const key = vars.decision === "approve" ? "approveSuccess" : "rejectSuccess";
      toast.success(t(`toast.${key}Body`), { title: t(`toast.${key}Title`) });
      setConfirmReject(false);
      onClose?.();
    },
    onError: () => {
      toast.error(t("toast.errorBody"), { title: t("toast.errorTitle") });
    },
  });

  if (!application) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const { partner, campaign } = application;
  const partnerName = partner ? `${partner.first_name} ${partner.last_name}` : t("unknownPartner");

  const avatar = partner?.profile_photo ? (
    <span className="inline-flex w-[2.5em] h-[2.5em] rounded-full overflow-hidden bg-bg shrink-0 border border-border-light">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={partner.profile_photo} alt={partnerName} className="w-full h-full object-cover" />
    </span>
  ) : null;

  const subtitle = `${campaign.product_name}`;

  const sections = [
    { key: "pitch",    label: tDetail("sections.pitch"),    icon: <FileText size="0.875em" />, content: <PitchSection application={application} /> },
    { key: "partner",  label: t("sections.partner"),        icon: <User size="0.875em" />,     content: <PartnerSection partner={partner} t={t} /> },
    { key: "timeline", label: tDetail("sections.timeline"), icon: <Activity size="0.875em" />, content: <TimelineSection application={application} locale={locale} cooldownDays={null} canReapply={false} t={tDetail} /> },
  ];

  return (
    <>
      <DetailOverlay
        open={open}
        onClose={onClose}
        title={partnerName}
        subtitle={subtitle}
        avatar={avatar}
        sections={sections}
        defaultSection="pitch"
        footer={
          <FooterContent
            application={application}
            actionsDisabled={actionsDisabled}
            isPending={mutation.isPending}
            onApprove={() => mutation.mutate({ decision: "approve" })}
            onRejectClick={() => setConfirmReject(true)}
            tTime={tTime}
            t={t}
          />
        }
      />

      <ConfirmDialog
        open={confirmReject}
        onCancel={() => setConfirmReject(false)}
        onConfirm={(reason) => mutation.mutate({ decision: "reject", reason })}
        title={t("confirmReject.title")}
        description={t("confirmReject.description")}
        confirmLabel={t("confirmReject.confirm")}
        cancelLabel={t("confirmReject.cancel")}
        destructive
        requireReason
        reasonLabel={t("confirmReject.reasonLabel")}
        reasonPlaceholder={t("confirmReject.reasonPlaceholder")}
      />
    </>
  );
}

function FooterContent({ application, actionsDisabled, isPending, onApprove, onRejectClick, tTime, t }) {
  if (application.status === "approved") {
    return (
      <span className="inline-flex items-center gap-[0.375em] h-[2em] px-[0.875em] rounded-[0.5em] bg-status-approved-bg text-status-approved-text text-[0.8125em] font-semibold">
        <Check className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
        {t("approvedFooter", { when: formatRelative(application.reviewed_at, tTime) })}
      </span>
    );
  }
  if (application.status === "rejected") {
    return (
      <div className="flex flex-col items-end gap-[0.5em] flex-1">
        <span className="inline-flex items-center gap-[0.375em] h-[2em] px-[0.875em] rounded-[0.5em] bg-status-rejected-bg text-status-rejected-text text-[0.8125em] font-semibold">
          <XIcon className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
          {t("rejectedFooter", { when: formatRelative(application.reviewed_at, tTime) })}
        </span>
        {application.review_reason && (
          <span className="text-[0.75em] text-text-muted font-body max-w-[28em] text-right line-clamp-2">
            {t("rejectedReasonPrefix")} {application.review_reason}
          </span>
        )}
      </div>
    );
  }
  // pending
  return (
    <>
      <AppButton
        variant="ghost"
        size="sm"
        onClick={onRejectClick}
        disabled={actionsDisabled || isPending}
        title={actionsDisabled ? t("gateTooltip") : undefined}
      >
        <span className="inline-flex items-center gap-[0.375em] text-status-rejected-text">
          <XIcon className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {t("actions.reject")}
        </span>
      </AppButton>
      <AppButton
        variant="primary"
        size="sm"
        onClick={onApprove}
        isLoading={isPending}
        disabled={actionsDisabled || isPending}
        title={actionsDisabled ? t("gateTooltip") : undefined}
      >
        <span className="inline-flex items-center gap-[0.375em]">
          <Check className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {t("actions.approve")}
        </span>
      </AppButton>
    </>
  );
}
