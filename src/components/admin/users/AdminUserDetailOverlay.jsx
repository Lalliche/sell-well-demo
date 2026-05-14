"use client";

/**
 * AdminUserDetailOverlay — opened from a row click on /admin/users.
 *
 * Sections (left rail of the shared `DetailOverlay`):
 *   1. Profile  — role-specific dump (partner: photo / bio / LinkedIn / phone /
 *                 categories / skills / CV link; company: logo / industry /
 *                 website / description).
 *   2. Account  — email · role · signup date · application_status badge ·
 *                 email-verified · prior admin note · suspended_at (if any).
 *   3. Activity — role-specific KPI grid (partner: active campaigns / leads /
 *                 conversion rate / earnings / flags; company: campaigns /
 *                 leads received / escrow available / commissions paid / flags).
 *
 * Footer: Reset password (secondary) + Suspend or Unsuspend (right side, red-
 * tinted destructive when suspending, neutral when unsuspending). NO approve /
 * reject flow — that lives on /admin/verifications. NO send message — out of
 * V1 scope (admin reaches users via email if needed). NO delete.
 *
 * Data: fetches via `fetchUserById(id)` so the overlay always has the latest
 * (post-mutation) row even if the parent table hasn't re-rendered yet.
 *
 * Document preview rule (CLAUDE.md §2): partner CV goes through DocumentCard
 * + DocumentPreviewModal, never a bare anchor. Parent owns the preview state.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import {
  User as UserIcon,
  Settings2,
  Activity as ActivityIcon,
  Ban,
  RotateCcw,
  KeyRound,
} from "lucide-react";

import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import AppButton from "@/components/ui/Buttons";
import Avatar from "@/components/shared/data-display/Avatar";
import DocumentPreviewModal from "@/components/shared/data-display/document/DocumentPreviewModal";
import UserProfileSection from "@/components/shared/user-profile/UserProfileSection";
import UserAccountSection from "@/components/shared/user-profile/UserAccountSection";
import UserActivitySection from "@/components/shared/user-profile/UserActivitySection";
import { profileLabels, accountLabels, activityLabels } from "@/components/shared/user-profile/labels";
import { useToast } from "@/hooks/useToast";

import {
  fetchUserById,
  resetUserPassword,
  suspendUser,
  unsuspendUser,
} from "@/lib/mock/admin";

/* ── Main overlay ─────────────────────────────────────────────────────── */
export default function AdminUserDetailOverlay({ userId, open, onClose }) {
  const t = useTranslations("Admin.users");
  const locale = useLocale();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [previewDoc, setPreviewDoc] = useState(null);
  const [confirm, setConfirm]       = useState(null); // { kind: "reset"|"suspend"|"unsuspend" }

  // Reload the user every time the overlay opens so it reflects mutations.
  const { data: user } = useQuery({
    queryKey: ["admin", "users", "byId", userId],
    queryFn: () => fetchUserById(userId),
    enabled: userId != null && open,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "users"] });
    if (userId != null) {
      qc.invalidateQueries({ queryKey: ["admin", "users", "byId", userId] });
    }
  };

  const resetMutation = useMutation({
    mutationFn: () => resetUserPassword(userId),
    onSuccess: () => {
      toast.success(t("toasts.resetSuccess", { email: user?.email ?? "" }), {
        title: t("toasts.resetTitle"),
      });
      setConfirm(null);
    },
  });

  const suspendMutation = useMutation({
    mutationFn: () => suspendUser(userId),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.suspendSuccess", { name: user?.display_name ?? "" }), {
        title: t("toasts.suspendTitle"),
      });
      setConfirm(null);
    },
  });

  const unsuspendMutation = useMutation({
    mutationFn: () => unsuspendUser(userId),
    onSuccess: () => {
      invalidate();
      toast.success(t("toasts.unsuspendSuccess", { name: user?.display_name ?? "" }), {
        title: t("toasts.unsuspendTitle"),
      });
      setConfirm(null);
    },
  });

  const handleConfirm = () => {
    if (confirm?.kind === "reset")     resetMutation.mutate();
    if (confirm?.kind === "suspend")   suspendMutation.mutate();
    if (confirm?.kind === "unsuspend") unsuspendMutation.mutate();
  };

  // While the user is being fetched, render nothing rather than an empty
  // DetailOverlay shell. Rendering the shell first then swapping in the
  // real sections re-uses the same React node, which means the overlay's
  // internal `active` state gets initialized to "" (from the empty
  // sections=[] case) and the `defaultSection="profile"` prop never has
  // a chance to take effect on the second render — the Profile tab would
  // show as un-highlighted. ~180ms invisible delay is fine; the row
  // click feedback comes from the row itself.
  if (!user) return null;

  const sections = [
    {
      key:   "profile",
      label: t("overlay.sections.profile"),
      icon:  <UserIcon size="1em" strokeWidth={1.75} />,
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
      key:   "account",
      label: t("overlay.sections.account"),
      icon:  <Settings2 size="1em" strokeWidth={1.75} />,
      content: <UserAccountSection user={user} locale={locale} labels={accountLabels(t)} />,
    },
    {
      key:   "activity",
      label: t("overlay.sections.activity"),
      icon:  <ActivityIcon size="1em" strokeWidth={1.75} />,
      content: <UserActivitySection user={user} locale={locale} labels={activityLabels(t)} />,
    },
  ];

  const avatar = (
    <div className="flex items-center gap-[0.625em]">
      {user.profile?.profile_photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profile.profile_photo}
          alt={user.display_name}
          className="w-[2.25em] h-[2.25em] rounded-[0.5em] object-cover border border-border-light"
        />
      ) : user.profile?.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.profile.logo}
          alt={user.display_name}
          className="w-[2.25em] h-[2.25em] rounded-[0.5em] object-cover border border-border-light bg-bg"
        />
      ) : (
        <Avatar name={user.display_name} size="md" />
      )}
    </div>
  );

  const subtitle = user.role === "sales_partner"
    ? t("overlay.rolePartner")
    : t("overlay.roleCompany");

  const footer = (
    <div className="flex items-center justify-between gap-[0.75em] w-full">
      <AppButton
        variant="secondary"
        size="md"
        onClick={() => setConfirm({ kind: "reset" })}
      >
        <span className="inline-flex items-center gap-[0.5em]">
          <KeyRound size="1em" strokeWidth={1.75} />
          {t("actions.resetPassword")}
        </span>
      </AppButton>
      {user.is_suspended ? (
        <AppButton
          variant="secondary"
          size="md"
          onClick={() => setConfirm({ kind: "unsuspend" })}
        >
          <span className="inline-flex items-center gap-[0.5em]">
            <RotateCcw size="1em" strokeWidth={1.75} />
            {t("actions.unsuspend")}
          </span>
        </AppButton>
      ) : (
        <AppButton
          variant="primary"
          size="md"
          onClick={() => setConfirm({ kind: "suspend" })}
          className="bg-status-rejected-text hover:bg-status-rejected-text/90 text-white"
        >
          <span className="inline-flex items-center gap-[0.5em]">
            <Ban size="1em" strokeWidth={1.75} />
            {t("actions.suspend")}
          </span>
        </AppButton>
      )}
    </div>
  );

  return (
    <>
      <DetailOverlay
        open={open}
        onClose={onClose}
        title={user.display_name}
        subtitle={subtitle}
        avatar={avatar}
        sections={sections}
        defaultSection="profile"
        footer={footer}
      />

      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        labels={{
          label:                t("overlay.previewModal.label"),
          close:                t("overlay.previewModal.close"),
          unpreviewableTitle:   t("overlay.previewModal.unpreviewableTitle"),
          unpreviewableBody:    t("overlay.previewModal.unpreviewableBody"),
        }}
      />

      {confirm ? (
        <ConfirmDialog
          open
          onCancel={() => setConfirm(null)}
          onConfirm={handleConfirm}
          title={
            confirm.kind === "reset"
              ? t("confirm.resetPassword.title")
              : confirm.kind === "suspend"
              ? t("confirm.suspend.title",   { name: user.display_name })
              : t("confirm.unsuspend.title", { name: user.display_name })
          }
          description={
            confirm.kind === "reset"
              ? t("confirm.resetPassword.body", { email: user.email })
              : confirm.kind === "suspend"
              ? t("confirm.suspend.body",   { name: user.display_name })
              : t("confirm.unsuspend.body", { name: user.display_name })
          }
          confirmLabel={
            confirm.kind === "reset"
              ? t("confirm.resetPassword.confirm")
              : confirm.kind === "suspend"
              ? t("confirm.suspend.confirm")
              : t("confirm.unsuspend.confirm")
          }
          cancelLabel={t("actions.cancel")}
          destructive={confirm.kind === "suspend"}
        />
      ) : null}
    </>
  );
}
