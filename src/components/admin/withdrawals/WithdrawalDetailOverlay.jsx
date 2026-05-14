"use client";

/**
 * WithdrawalDetailOverlay — feature wrapper around `DetailOverlay`, scoped
 * to one WithdrawalRequest. Two sections:
 *
 *   1. Request — requester block, amount, full unmasked destination, status,
 *                proof preview (when completed), admin reason (when rejected),
 *                linked WalletTransaction summary (company completed only).
 *   2. Audit  — timeline of state transitions (requested / processing /
 *               completed | rejected), built from the request's timestamps.
 *
 * Footer is a state machine — buttons render based on current status:
 *   pending     → Mark as processing · Reject
 *   processing  → Mark as completed · Reject
 *   completed   → (read-only)
 *   rejected    → (read-only)
 *
 * All three actions hit a ConfirmDialog:
 *   - processing: simple confirm
 *   - completed:  required FileInput (PDF/JPG/PNG ≤5MB), Submit disabled
 *                 until file is selected
 *   - reject:     required reason textarea, destructive
 *
 * Each mutation invalidates ['admin','withdrawals'] so the queue + overlay
 * refresh simultaneously.
 *
 * Polymorphism: company role on `completed` writes a WalletTransaction
 * (handled inside the mock). Partner role does NOT — partner earnings live
 * outside EscrowWallet.
 */

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Activity,
  Banknote,
  Landmark,
  Mail,
  Calendar,
  Building2,
  User as UserIcon,
} from "lucide-react";

import DetailOverlay from "@/components/shared/overlays/DetailOverlay";
import ConfirmDialog from "@/components/shared/feedback/ConfirmDialog";
import AppButton from "@/components/ui/Buttons";
import { FileInput } from "@/components/ui/FormInputs";
import Avatar from "@/components/shared/data-display/Avatar";
import StatusBadge from "@/components/shared/data-display/StatusBadge";
import DocumentCard from "@/components/shared/data-display/document/DocumentCard";
import DocumentPreviewModal from "@/components/shared/data-display/document/DocumentPreviewModal";
import TimelineStep from "@/components/shared/data-display/timeline/TimelineStep";
import { useToast } from "@/hooks/useToast";
import { format } from "@/lib/format/currency";
import { fileNameFromUrl } from "@/lib/format/file";
import { cn } from "@/lib/utils";
import {
  markWithdrawalProcessing,
  completeWithdrawal,
  rejectWithdrawal,
} from "@/lib/mock/admin";

/* ── tiny field row helper ────────────────────────────────────────────── */
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

/* ── Section: Request ─────────────────────────────────────────────────── */

function RequestSection({ row, t, locale, onPreviewProof }) {
  const isCompany = row.requester_role === "company";
  const dest = row.destination_snapshot ?? {};

  const proofDoc =
    row.status === "completed" && row.proof_document
      ? {
          kind: "file",
          fileUrl: row.proof_document,
          title: t("overlay.proof.title", { id: row.id }),
          subtitle: fileNameFromUrl(row.proof_document),
        }
      : null;

  const dateFmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString(locale === "fr" ? "fr-DZ" : "en-US", {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : null;

  return (
    <div className="flex flex-col gap-[1.5em]">
      {/* Requester */}
      <div className="flex items-start gap-[0.875em]">
        <Avatar name={row.display_name} size="lg" />
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[1.0625em] font-semibold text-text font-heading">
            {row.display_name}
          </span>
          <span className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-secondary">
            {isCompany ? (
              <>
                <Building2 size="0.8125em" strokeWidth={1.75} />
                {t("roles.company")}
              </>
            ) : (
              <>
                <UserIcon size="0.8125em" strokeWidth={1.75} />
                {t("roles.partner")}
              </>
            )}
          </span>
          {row.email && (
            <span className="inline-flex items-center gap-[0.375em] text-[0.8125em] text-text-muted">
              <Mail size="0.75em" strokeWidth={1.75} />
              {row.email}
            </span>
          )}
        </div>
      </div>

      {/* Amount + status row */}
      <div className="flex items-end justify-between gap-[1em] bg-bg-alt rounded-[0.625em] p-[1em] border border-border-light">
        <div className="flex flex-col gap-[0.25em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("overlay.amountLabel")}
          </span>
          <span className="text-[1.75em] font-semibold font-mono tabular-nums text-text leading-none">
            {format(row.amount)}
          </span>
        </div>
        <StatusBadge status={row.status} label={t(`statuses.${row.status}`)} />
      </div>

      {/* Payout destination */}
      <div className="flex flex-col gap-[0.75em]">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body inline-flex items-center gap-[0.375em]">
          {row.payout_method === "ccp" ? (
            <Banknote size="0.875em" strokeWidth={1.75} />
          ) : (
            <Landmark size="0.875em" strokeWidth={1.75} />
          )}
          {row.payout_method === "ccp" ? t("methods.ccpFull") : t("methods.bankFull")}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
          {row.payout_method === "ccp" ? (
            <>
              <Field label={t("overlay.destination.ccpAccount")} mono>
                {dest.ccp_account}
              </Field>
              <Field label={t("overlay.destination.ccpKey")} mono>
                {dest.ccp_key}
              </Field>
            </>
          ) : (
            <>
              <Field label={t("overlay.destination.bankName")}>
                {dest.bank_name}
              </Field>
              <Field label={t("overlay.destination.rib")} mono>
                {dest.rib}
              </Field>
            </>
          )}
          <Field label={t("overlay.destination.holderName")}>
            {dest.account_holder_name}
          </Field>
        </div>
      </div>

      {/* Proof of payment — completed only */}
      {proofDoc && (
        <div className="flex flex-col gap-[0.5em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            {t("overlay.proof.heading")}
          </span>
          <DocumentCard
            document={proofDoc}
            variant="row"
            onPreview={onPreviewProof}
            labels={{
              preview:      t("overlay.proof.preview"),
              download:     t("overlay.proof.download"),
              openInNewTab: t("overlay.proof.openInNewTab"),
            }}
            className="bg-surface border border-border-light"
          />
          <span className="text-[0.75em] text-text-muted inline-flex items-center gap-[0.375em]">
            <Calendar size="0.75em" strokeWidth={1.75} />
            {t("overlay.proof.uploadedAt", { date: dateFmt(row.proof_uploaded_at) ?? "—" })}
          </span>
        </div>
      )}

      {/* Linked WalletTransaction — company completed only */}
      {row.status === "completed" && isCompany && row.wallet_transaction && (
        <div className="flex flex-col gap-[0.375em] bg-status-active-bg/40 border border-accent-border rounded-[0.5em] p-[0.875em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-accent-text font-body">
            {t("overlay.linkedTx.heading")}
          </span>
          <span className="text-[0.8125em] text-text-secondary">
            {t("overlay.linkedTx.body", { txId: row.wallet_transaction })}
          </span>
        </div>
      )}

      {/* Rejection reason callout */}
      {row.status === "rejected" && row.admin_notes && (
        <div className="flex flex-col gap-[0.375em] bg-status-rejected-bg/40 border border-status-rejected-text/30 rounded-[0.5em] p-[0.875em]">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-status-rejected-text font-body">
            {t("overlay.rejection.heading")}
          </span>
          <p className="text-[0.875em] text-text leading-[1.55] whitespace-pre-wrap">
            {row.admin_notes}
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Section: Audit trail ─────────────────────────────────────────────── */

function AuditSection({ row, t, locale }) {
  const dateFmt = (iso) =>
    iso
      ? new Date(iso).toLocaleString(locale === "fr" ? "fr-DZ" : "en-US", {
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })
      : null;

  const steps = [
    {
      title: t("overlay.audit.requested"),
      body: t("overlay.audit.requestedBody", { amount: format(row.amount) }),
      timestamp: dateFmt(row.requested_at),
      state: "complete",
    },
  ];

  if (row.status === "processing" || row.status === "completed") {
    steps.push({
      title: t("overlay.audit.processing"),
      body: t("overlay.audit.processingBody"),
      timestamp: dateFmt(row.processed_at),
      state: row.status === "processing" ? "current" : "complete",
    });
  }

  if (row.status === "completed") {
    steps.push({
      title: t("overlay.audit.completed"),
      body: t("overlay.audit.completedBody"),
      timestamp: dateFmt(row.proof_uploaded_at),
      state: "approved",
    });
  }

  if (row.status === "rejected") {
    steps.push({
      title: t("overlay.audit.rejected"),
      body: row.admin_notes || t("overlay.audit.rejectedBody"),
      timestamp: dateFmt(row.processed_at),
      state: "rejected",
    });
  }

  return (
    <ol className="flex flex-col gap-[1em]">
      {steps.map((step, i) => (
        <TimelineStep key={i} step={step} isLast={i === steps.length - 1} />
      ))}
    </ol>
  );
}

/* ── Overlay ──────────────────────────────────────────────────────────── */

export default function WithdrawalDetailOverlay({ open, onClose, row }) {
  const t = useTranslations("Admin.withdrawals");
  const locale = useLocale();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Which confirm dialog is open: null | "processing" | "completed" | "reject"
  const [confirmKind, setConfirmKind] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "withdrawals"] });

  const processMut = useMutation({
    mutationFn: () => markWithdrawalProcessing(row.id),
    onSuccess: (updated) => {
      if (!updated) return toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
      invalidate();
      toast.success(t("toasts.processingSuccessBody"), { title: t("toasts.processingSuccessTitle") });
      onClose?.();
    },
  });

  const completeMut = useMutation({
    mutationFn: (file) => completeWithdrawal(row.id, file),
    onSuccess: (updated) => {
      if (!updated) return toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
      invalidate();
      toast.success(
        t("toasts.completedSuccessBody", { name: row.display_name }),
        { title: t("toasts.completedSuccessTitle") },
      );
      onClose?.();
    },
  });

  const rejectMut = useMutation({
    mutationFn: (reason) => rejectWithdrawal(row.id, { reason }),
    onSuccess: (updated) => {
      if (!updated) return toast.error(t("toasts.errorBody"), { title: t("toasts.errorTitle") });
      invalidate();
      toast.success(t("toasts.rejectedSuccessBody"), { title: t("toasts.rejectedSuccessTitle") });
      onClose?.();
    },
  });

  if (!row) {
    return <DetailOverlay open={open} onClose={onClose} sections={[]} />;
  }

  const sections = [
    {
      key: "request",
      label: t("overlay.sections.request"),
      icon: <FileText size="0.875em" />,
      content: (
        <RequestSection row={row} t={t} locale={locale} onPreviewProof={setPreviewDoc} />
      ),
    },
    {
      key: "audit",
      label: t("overlay.sections.audit"),
      icon: <Activity size="0.875em" />,
      content: <AuditSection row={row} t={t} locale={locale} />,
    },
  ];

  // Footer state machine
  const isSubmitting =
    processMut.isPending || completeMut.isPending || rejectMut.isPending;

  const footer = (() => {
    if (row.status === "pending") {
      return (
        <div className="flex items-center justify-end gap-[0.5em] flex-wrap">
          <AppButton variant="ghost" onClick={() => setConfirmKind("reject")} disabled={isSubmitting}>
            {t("actions.reject")}
          </AppButton>
          <AppButton variant="primary" onClick={() => setConfirmKind("processing")} disabled={isSubmitting}>
            {t("actions.markProcessing")}
          </AppButton>
        </div>
      );
    }
    if (row.status === "processing") {
      return (
        <div className="flex items-center justify-end gap-[0.5em] flex-wrap">
          <AppButton variant="ghost" onClick={() => setConfirmKind("reject")} disabled={isSubmitting}>
            {t("actions.reject")}
          </AppButton>
          <AppButton variant="primary" onClick={() => { setProofFile(null); setConfirmKind("completed"); }} disabled={isSubmitting}>
            {t("actions.markCompleted")}
          </AppButton>
        </div>
      );
    }
    // completed | rejected → read-only footer
    return (
      <div className="flex items-center justify-end">
        <span className="text-[0.8125em] text-text-muted">
          {t("overlay.readOnly")}
        </span>
      </div>
    );
  })();

  return (
    <>
      <DetailOverlay
        open={open}
        onClose={onClose}
        title={row.display_name}
        subtitle={t("overlay.subtitle", {
          id: row.id,
          amount: format(row.amount),
        })}
        avatar={<Avatar name={row.display_name} size="md" />}
        sections={sections}
        footer={footer}
        defaultSection="request"
      />

      {/* Mark as processing — simple confirm */}
      <ConfirmDialog
        open={confirmKind === "processing"}
        onCancel={() => setConfirmKind(null)}
        onConfirm={() => { setConfirmKind(null); processMut.mutate(); }}
        title={t("confirm.processing.title", { id: row.id })}
        description={t("confirm.processing.body")}
        confirmLabel={t("actions.markProcessing")}
        cancelLabel={t("actions.cancel")}
      />

      {/* Mark as completed — required FileInput, Submit gated on selection */}
      <CompleteWithdrawalDialog
        open={confirmKind === "completed"}
        onCancel={() => setConfirmKind(null)}
        onConfirm={() => { const f = proofFile; setConfirmKind(null); completeMut.mutate(f); }}
        proofFile={proofFile}
        setProofFile={setProofFile}
        t={t}
      />

      {/* Reject — required reason, destructive */}
      <ConfirmDialog
        open={confirmKind === "reject"}
        onCancel={() => setConfirmKind(null)}
        onConfirm={(reason) => { setConfirmKind(null); rejectMut.mutate(reason); }}
        title={t("confirm.reject.title", { id: row.id })}
        description={t("confirm.reject.body")}
        confirmLabel={t("actions.reject")}
        cancelLabel={t("actions.cancel")}
        destructive
        requireReason
        reasonLabel={t("confirm.reject.reasonLabel")}
        reasonPlaceholder={t("confirm.reject.reasonPlaceholder")}
      />

      {/* Proof preview (PDF/image) */}
      <DocumentPreviewModal
        open={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
        labels={{
          previewLabel:       t("overlay.proof.previewLabel"),
          close:              t("overlay.proof.close"),
          openInNewTab:       t("overlay.proof.openInNewTab"),
          download:           t("overlay.proof.download"),
          unpreviewableTitle: t("overlay.proof.unpreviewableTitle"),
          unpreviewableBody:  t("overlay.proof.unpreviewableBody"),
        }}
      />
    </>
  );
}

/* ── Bespoke "Mark as completed" dialog ──────────────────────────────── */

/**
 * The shared ConfirmDialog has `requireReason` (textarea) but not
 * `requireFile`. For the completion flow we need a FileInput + Submit-disabled-
 * until-selected guard, so we render our own small portal dialog that
 * mirrors ConfirmDialog's chrome.
 *
 * Hard validation: button disabled until `proofFile instanceof File`. Mock
 * enforces it server-side too (`completeWithdrawal` returns null without a
 * file) but the UI shouldn't let the user click the button at all.
 */
function CompleteWithdrawalDialog({
  open,
  onCancel,
  onConfirm,
  proofFile,
  setProofFile,
  t,
}) {
  if (!open) return null;

  const isReady = proofFile instanceof File;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center p-[1em]"
      style={{
        background: "rgba(26,26,26,0.4)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}
    >
      <div className="w-full max-w-[30em] bg-surface rounded-[0.75em] shadow-xl p-[2em] flex flex-col gap-[1em]">
        <header className="flex flex-col gap-[0.375em]">
          <h2 className="font-heading text-[1.0625em] font-semibold text-text">
            {t("confirm.completed.title")}
          </h2>
          <p className="text-[0.875em] text-text-secondary leading-[1.55]">
            {t("confirm.completed.body")}
          </p>
        </header>

        <FileInput
          label={t("confirm.completed.proofLabel")}
          value={proofFile}
          onChange={setProofFile}
          accept=".pdf,.jpg,.jpeg,.png,image/*"
          maxSizeMb={5}
          required
          helperText={t("confirm.completed.proofHelper")}
        />

        <div className="flex items-center justify-end gap-[0.5em] pt-[0.25em]">
          <AppButton variant="ghost" size="md" onClick={onCancel}>
            {t("actions.cancel")}
          </AppButton>
          <AppButton variant="primary" size="md" onClick={onConfirm} disabled={!isReady}>
            {t("actions.markCompleted")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
