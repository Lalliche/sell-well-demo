"use client";

/**
 * VerificationDetailOverlay — feature wrapper around the shared
 * `DetailOverlay` primitive, scoped to one user awaiting admin review.
 *
 * Sections (left rail):
 *   1. Profile     — role-specific profile dump (partner: photo / bio /
 *                    LinkedIn / phone / categories / skills / CV link;
 *                    company: logo / industry / website / description).
 *   2. Account     — email, signup date, days waiting, current status,
 *                    prior review notes (if any).
 *
 * Footer: three actions — Approve (primary), Request more info (secondary,
 * opens ConfirmDialog with required textarea), Reject (ghost+destructive,
 * same pattern). All three fire toasts on success.
 *
 * Authority: this overlay never touches Lead rows; the lead-authority
 * constraint doesn't apply here.
 */

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User as UserIcon, Settings2, Mail, Calendar } from "lucide-react";

import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import AppButton from "@/components/ui/Buttons";
import Avatar from "@/components/shared/data-display/Avatar";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import DocumentPreviewModal from "@/components/shared/data-display/document/DocumentPreviewModal";
import UserProfileSection from "@/components/shared/user-profile/UserProfileSection";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";

import { approveUser, rejectUser, requestMoreInfo } from "@/lib/mock/admin";

/* ── tiny dl-style row ────────────────────────────────────────────────── */
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

/** Map this overlay's i18n namespace to the labels the shared
 *  UserProfileSection consumes. Keeps the i18n key shape decoupled. */
function profileLabels(t) {
  return {
    profileMissing: t("overlay.profileMissing"),
    bio:            t("overlay.bio"),
    categories:     t("overlay.categories"),
    skills:         t("overlay.skills"),
    cv:             t("overlay.cv"),
    cvTitle:        t("overlay.cvTitle", { name: "{name}" }),
    previewCv:      t("overlay.previewCv"),
    downloadCv:     t("overlay.downloadCv"),
    openInNewTab:   t("overlay.openInNewTab"),
    linkedin:       t("overlay.linkedin"),
    description:    t("overlay.description"),
  };
}

/* ── section: Account ─────────────────────────────────────────────────── */
function AccountSection({ user, t, locale }) {
  const formattedDate = (iso) => {
    if (!iso) return null;
    return new Date(iso).toLocaleDateString(locale === "fr" ? "fr-DZ" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  return (
    <div className="flex flex-col gap-[1.25em]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
        <Field label={t("overlay.email")}>
          <span className="inline-flex items-center gap-[0.375em]">
            <Mail size="0.8125em" strokeWidth={1.75} className="text-text-muted" />
            {user.email}
          </span>
        </Field>
        <Field label={t("overlay.role")}>
          {user.role === "sales_partner" ? t("overlay.rolePartner") : t("overlay.roleCompany")}
        </Field>
        <Field label={t("overlay.signupDate")}>
          <span className="inline-flex items-center gap-[0.375em]">
            <Calendar size="0.8125em" strokeWidth={1.75} className="text-text-muted" />
            {formattedDate(user.created_at)}
          </span>
        </Field>
        <Field label={t("overlay.daysWaiting")} mono>
          {user.days_waiting === 0 ? `<1` : user.days_waiting}
        </Field>
        <Field label={t("overlay.status")}>
          <StatusBadge status={user.application_status} label={t(`statuses.${user.application_status}`)} />
        </Field>
        <Field label={t("overlay.emailVerified")}>
          {user.is_email_verified ? t("overlay.yes") : t("overlay.no")}
        </Field>
      </div>

      {user.application_review_notes && (
        <div className="flex flex-col gap-[0.5em] p-[1em] bg-bg-alt rounded-[0.625em] border border-border-light">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("overlay.priorNote")}
          </span>
          <p className="text-[0.8125em] text-text-secondary leading-[1.6] whitespace-pre-wrap">
            {user.application_review_notes}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── overlay component ────────────────────────────────────────────────── */

export default function VerificationDetailOverlay({ open, onClose, user }) {
  const t = useTranslations("Admin.verifications");
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Which confirm dialog is open: null | "approve" | "more_info" | "reject"
  const [confirmKind, setConfirmKind] = useState(null);

  // Document being previewed in the shared DocumentPreviewModal (CV, etc.).
  const [previewDoc, setPreviewDoc] = useState(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] });

  const approveMut = useMutation({
    mutationFn: () => approveUser(user.id),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.approveSuccess", { name: user.display_name }), {
        title: t("toasts.approveTitle"),
      });
      onClose?.();
    },
  });

  const rejectMut = useMutation({
    mutationFn: (reason) => rejectUser(user.id, { reason }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.rejectSuccess", { name: user.display_name }), {
        title: t("toasts.rejectTitle"),
      });
      onClose?.();
    },
  });

  const moreInfoMut = useMutation({
    mutationFn: (note) => requestMoreInfo(user.id, { note }),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.moreInfoSuccess", { name: user.display_name }), {
        title: t("toasts.moreInfoTitle"),
      });
      onClose?.();
    },
  });

  if (!user) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const avatar = (() => {
    if (user.role === "sales_partner" && user.profile?.profile_photo) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profile.profile_photo}
          alt={user.display_name}
          className="w-[2.5em] h-[2.5em] rounded-[0.5em] object-cover border border-border-light shrink-0"
        />
      );
    }
    if (user.role === "company" && user.profile?.logo) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profile.logo}
          alt={user.display_name}
          className="w-[2.5em] h-[2.5em] rounded-[0.5em] object-cover border border-border-light shrink-0 bg-bg"
        />
      );
    }
    return <Avatar name={user.display_name} size="md" />;
  })();

  const sections = [
    {
      key: "profile",
      label: t("overlay.sections.profile"),
      icon: <UserIcon size="0.875em" />,
      content: (
        <UserProfileSection
          user={user}
          locale={locale}
          onPreviewDoc={setPreviewDoc}
          labels={profileLabels(t)}
        />
      ),
    },
    {
      key: "account",
      label: t("overlay.sections.account"),
      icon: <Settings2 size="0.875em" />,
      content: <AccountSection user={user} t={t} locale={locale} />,
    },
  ];

  const isSubmitting =
    approveMut.isPending || rejectMut.isPending || moreInfoMut.isPending;

  return (
    <>
      <DetailOverlay
        open={open}
        onClose={onClose}
        title={user.display_name}
        subtitle={`${user.role === "sales_partner" ? t("overlay.rolePartner") : t("overlay.roleCompany")} · ${user.email}`}
        avatar={avatar}
        sections={sections}
        footer={
          <div className="flex items-center justify-end gap-[0.5em] flex-wrap">
            <AppButton
              variant="ghost"
              onClick={() => setConfirmKind("reject")}
              disabled={isSubmitting}
            >
              {t("actions.reject")}
            </AppButton>
            <AppButton
              variant="secondary"
              onClick={() => setConfirmKind("more_info")}
              disabled={isSubmitting}
            >
              {t("actions.requestMoreInfo")}
            </AppButton>
            <AppButton
              variant="primary"
              onClick={() => setConfirmKind("approve")}
              disabled={isSubmitting}
            >
              {t("actions.approve")}
            </AppButton>
          </div>
        }
        defaultSection="profile"
      />

      {/* Approve confirm — no reason required */}
      <ConfirmDialog
        open={confirmKind === "approve"}
        onCancel={() => setConfirmKind(null)}
        onConfirm={() => { setConfirmKind(null); approveMut.mutate(); }}
        title={t("confirm.approve.title", { name: user.display_name })}
        description={t("confirm.approve.body")}
        confirmLabel={t("actions.approve")}
        cancelLabel={t("actions.cancel")}
      />

      {/* Request more info — requires note */}
      <ConfirmDialog
        open={confirmKind === "more_info"}
        onCancel={() => setConfirmKind(null)}
        onConfirm={(note) => { setConfirmKind(null); moreInfoMut.mutate(note); }}
        title={t("confirm.moreInfo.title", { name: user.display_name })}
        description={t("confirm.moreInfo.body")}
        confirmLabel={t("actions.requestMoreInfo")}
        cancelLabel={t("actions.cancel")}
        requireReason
        reasonLabel={t("confirm.moreInfo.reasonLabel")}
        reasonPlaceholder={t("confirm.moreInfo.reasonPlaceholder")}
      />

      {/* Reject — requires reason, destructive */}
      <ConfirmDialog
        open={confirmKind === "reject"}
        onCancel={() => setConfirmKind(null)}
        onConfirm={(reason) => { setConfirmKind(null); rejectMut.mutate(reason); }}
        title={t("confirm.reject.title", { name: user.display_name })}
        description={t("confirm.reject.body")}
        confirmLabel={t("actions.reject")}
        cancelLabel={t("actions.cancel")}
        destructive
        requireReason
        reasonLabel={t("confirm.reject.reasonLabel")}
        reasonPlaceholder={t("confirm.reject.reasonPlaceholder")}
      />

      {/* Shared preview modal for CV / future documents */}
      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        labels={{
          previewLabel:        t("overlay.previewModal.label"),
          close:               t("overlay.previewModal.close"),
          openInNewTab:        t("overlay.openInNewTab"),
          download:            t("overlay.downloadCv"),
          unpreviewableTitle:  t("overlay.previewModal.unpreviewableTitle"),
          unpreviewableBody:   t("overlay.previewModal.unpreviewableBody"),
        }}
      />
    </>
  );
}
