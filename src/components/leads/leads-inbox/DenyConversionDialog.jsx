"use client";

/**
 * DenyConversionDialog — bespoke dialog for "Did not convert".
 *
 * Per `escrow-leads-spec.md`: the company saying "this didn't convert"
 * is NOT a one-click escrow refund — it kicks off SellWell's
 * verification flow (we contact the client to confirm). So the dialog's
 * trust copy must be:
 *   - "We'll verify this with the client before releasing funds."
 *   - "Your escrow stays frozen until we rule."
 *   - Required reason textarea so the partner sees the real explanation.
 *
 * Visually quieter than ConfirmSaleDialog (no big amount, no editable
 * input, no green release strip) — this is a status flip, not a money
 * movement. Uses an amber Shield icon to communicate "verification
 * in progress, not punitive."
 */

import { useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ShieldAlert, Lock } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { TextArea } from "@/components/ui/FormInputs";

const REASON_MIN = 20;
const REASON_MAX = 500;

export default function DenyConversionDialog({
  open,
  onCancel,
  onConfirm,
  lead,
  isPending,
}) {
  const t = useTranslations("Leads.companyInbox.denyConversion");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setTouched(false);
    }
  }, [open, lead?.id]);

  const handleCancel = useCallback(() => {
    if (isPending) return;
    onCancel?.();
  }, [isPending, onCancel]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") handleCancel(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, handleCancel]);

  if (!open || !lead) return null;
  const trimmedLen = reason.trim().length;
  const errorMessage =
    touched && trimmedLen < REASON_MIN ? t("reasonError", { min: REASON_MIN }) : null;
  const canConfirm = !isPending && trimmedLen >= REASON_MIN;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-[1em]">
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(26,26,26,0.4)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: "fade-in 0.15s ease-out",
        }}
        onClick={handleCancel}
      />

      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="deny-title"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="relative bg-surface rounded-[0.75em] shadow-xl w-full max-w-[34em] p-[1.75em] flex flex-col gap-[1.25em]"
      >
        {/* Headline — amber shield + title */}
        <div className="flex items-start gap-[0.75em]">
          <span className="shrink-0 inline-flex items-center justify-center w-[2.5em] h-[2.5em] rounded-full bg-status-pending-bg text-status-pending-text">
            <ShieldAlert className="w-[1.25em] h-[1.25em]" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col gap-[0.125em] min-w-0 flex-1 pt-[0.125em]">
            <h2
              id="deny-title"
              className="font-heading text-[1.125em] font-bold tracking-[-0.01em] text-text leading-tight"
            >
              {t("headline")}
            </h2>
            <p className="text-[0.8125em] text-text-secondary font-body leading-snug">
              {t("subheadline", { name: lead.client_full_name ?? t("thisLead") })}
            </p>
          </div>
        </div>

        {/* Reason textarea */}
        <div className="flex flex-col gap-[0.25em]">
          <TextArea
            label={t("reasonLabel")}
            placeholder={t("reasonPlaceholder")}
            value={reason}
            onChange={(v) => {
              if (v.length <= REASON_MAX) setReason(v);
              if (!touched) setTouched(true);
            }}
            rows={4}
            errorMessage={errorMessage}
            required
          />
          <div className="flex items-center justify-between">
            <span className="text-[0.6875em] text-text-muted font-body">
              {t("reasonHelper")}
            </span>
            <span className="font-mono text-[0.6875em] text-text-muted tabular-nums">
              {trimmedLen} / {REASON_MAX}
            </span>
          </div>
        </div>

        {/* Verification trust strip — escrow stays frozen */}
        <div className="flex items-start gap-[0.625em] p-[0.875em] rounded-[0.625em] bg-status-active-bg border border-accent-border">
          <Lock
            className="w-[1em] h-[1em] text-accent-text shrink-0 mt-[0.125em]"
            strokeWidth={1.75}
          />
          <p className="text-[0.8125em] text-accent-text font-body leading-[1.5]">
            {t("verificationStrip")}
          </p>
        </div>

        {/* T&Cs inline link */}
        <p className="text-[0.75em] text-text-muted font-body leading-[1.55] text-center">
          {t.rich("tcs", {
            link: (chunks) => (
              <Link
                href="/terms"
                className="text-accent-text hover:text-accent underline underline-offset-2 transition-colors duration-150"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-end gap-[0.5em]">
          <AppButton variant="ghost" size="md" onClick={handleCancel} disabled={isPending}>
            {t("cancel")}
          </AppButton>
          <AppButton
            variant="primary"
            size="md"
            onClick={() => onConfirm?.(reason.trim())}
            isLoading={isPending}
            disabled={!canConfirm}
          >
            {t("confirm")}
          </AppButton>
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}
