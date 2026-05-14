/**
 * ConfirmDialog — Modal confirmation dialog, portal-rendered over everything.
 *
 * Props:
 *   open            boolean — controls visibility
 *   onCancel        () => void
 *   onConfirm       (reason?: string) => void
 *   title           string
 *   description     string — optional body text
 *   confirmLabel    string (default: "Confirm")
 *   cancelLabel     string (default: "Cancel")
 *   destructive     boolean — styles confirm button in red (default: false)
 *   requireReason   boolean — shows a textarea; confirm disabled until filled (default: false)
 *   reasonLabel     string (default: "Reason")
 *   reasonPlaceholder string
 *
 * States:
 *   closed · open · destructive (red confirm) · with reason textarea · submitting (confirm loading)
 *
 * Behavior:
 *   Escape key cancels. Backdrop click cancels. Body scroll locked while open.
 *   Portal renders to document.body (z-index 80).
 *
 * Design system (design-system-final.md §Modals):
 *   max-width 480px, radius 12px, padding 32px
 *   backdrop rgba(26,26,26,0.4) + blur(4px)
 */

"use client";
import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";

export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter reason...",
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    setSubmitting(true);
    try {
      await onConfirm?.(requireReason ? reason : undefined);
    } finally {
      setSubmitting(false);
      setReason("");
    }
  }, [onConfirm, reason, requireReason]);

  const handleCancel = useCallback(() => {
    if (submitting) return;
    setReason("");
    onCancel?.();
  }, [onCancel, submitting]);

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

  if (!open) return null;

  const canConfirm = !submitting && (!requireReason || reason.trim().length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-[1em]"
      style={{ animation: "fade-in 0.15s ease-out" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,26,26,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div
        className="relative bg-surface rounded-[0.75em] shadow-xl w-full max-w-[30em] p-[2em] flex flex-col gap-[1.25em]"
        style={{ animation: "scale-in 0.15s ease-out" }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
      >
        <div className="flex flex-col gap-[0.5em]">
          <h2 id="confirm-title" className="text-[1.125em] font-bold text-text font-heading leading-snug">
            {title}
          </h2>
          {description && (
            <p className="text-[0.875em] text-text-secondary font-body leading-relaxed">{description}</p>
          )}
        </div>

        {requireReason && (
          <div className="flex flex-col gap-[0.375em]">
            <label className="text-[0.875em] font-medium text-text font-body">{reasonLabel}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className={cn(
                "w-full bg-surface border border-border rounded-[0.5em] px-[0.875em] py-[0.625em]",
                "text-[0.875em] text-text font-body placeholder:text-text-muted resize-none",
                "focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(59,110,204,0.15)]",
                "transition-[border-color,box-shadow] duration-150",
              )}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-[0.75em]">
          <AppButton variant="ghost" size="sm" onClick={handleCancel} disabled={submitting}>
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={destructive ? "accent" : "primary"}
            size="sm"
            onClick={handleConfirm}
            disabled={!canConfirm}
            isLoading={submitting}
            className={destructive ? "bg-[#B13B3B] hover:bg-[#9B2B2B]" : ""}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>,
    document.body,
  );
}
