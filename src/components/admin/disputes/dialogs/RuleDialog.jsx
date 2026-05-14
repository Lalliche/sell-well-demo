"use client";

/**
 * RuleDialog — money-moving dispute resolution dialog. Used for both:
 *
 *   kind="sale_happened" — releases commission + platform fee from escrow;
 *                          bumps company flag_count; flips lead to
 *                          converted_verified.
 *   kind="no_sale"       — returns reservation to company escrow; bumps
 *                          PARTNER flag_count; flips lead to not_converted.
 *
 * Same shape (notes required, financial-tone description) but the body
 * copy + visual tone differ. We pass `kind` to switch tone + i18n keys.
 *
 * Per the design-system "financial actions never auto-dismiss toasts" rule,
 * the parent's mutation success toast is fine — but this dialog also pairs
 * the visual heading with a trust-strip mini-callout summarizing the
 * money flow so admin doesn't fat-finger the wrong button.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { TextArea } from "@/components/ui/FormInputs";
import { useToast } from "@/hooks/useToast";
import { format } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function RuleDialog({
  kind,                       // "sale_happened" | "no_sale"
  open,
  onCancel,
  onConfirm,
  clientName,
  commissionAmount,
}) {
  const t = useTranslations(
    kind === "sale_happened"
      ? "Admin.disputes.ruleSaleDialog"
      : "Admin.disputes.ruleNoSaleDialog",
  );
  const tCommon = useTranslations("Common");
  const { toast } = useToast();

  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const notesValid = notes.trim().length >= 20;
  const isSale = kind === "sale_happened";

  const handleConfirm = () => {
    setTouched(true);
    if (!notesValid) {
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
      return;
    }
    onConfirm(notes.trim());
    setNotes(""); setTouched(false);
  };

  const handleCancel = () => {
    onCancel();
    setNotes(""); setTouched(false);
  };

  const Icon = isSale ? CheckCircle2 : XCircle;
  const iconTone = isSale ? "text-trend-positive" : "text-status-rejected-text";
  const stripTone = isSale
    ? "bg-status-approved-bg/40 border-trend-positive/20 text-trend-positive"
    : "bg-status-pending-bg/40 border-status-pending-text/20 text-status-pending-text";

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
      onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
    >
      <div className="w-full max-w-[34em] bg-surface rounded-[0.75em] shadow-xl p-[2em] flex flex-col gap-[1em]">
        <header className="flex items-start gap-[0.75em]">
          <Icon size="1.5em" strokeWidth={1.75} className={iconTone} />
          <div className="flex flex-col gap-[0.25em]">
            <h2 className="font-heading text-[1.0625em] font-semibold text-text leading-[1.3]">
              {t("title", { client: clientName })}
            </h2>
            <p className="text-[0.875em] text-text-secondary leading-[1.55]">
              {t("body")}
            </p>
          </div>
        </header>

        {/* Money-flow trust strip */}
        <div className={cn(
          "flex flex-col gap-[0.375em] p-[0.875em] border rounded-[0.5em]",
          stripTone,
        )}>
          <span className="text-[0.6875em] uppercase tracking-[0.08em] font-semibold font-body">
            {t("strip.heading")}
          </span>
          <p className="text-[0.8125em] leading-[1.5] text-text whitespace-pre-line">
            {t("strip.body", { amount: format(commissionAmount) })}
          </p>
        </div>

        <TextArea
          label={t("notesLabel")}
          value={notes}
          onChange={setNotes}
          rows={4}
          required
          errorMessage={touched && !notesValid ? t("notesError") : undefined}
          helperText={t("notesHelper")}
        />

        <div className="flex items-center justify-end gap-[0.5em] pt-[0.25em]">
          <AppButton variant="ghost" size="md" onClick={handleCancel}>
            {tCommon("cancel")}
          </AppButton>
          <AppButton variant={isSale ? "accent" : "primary"} size="md" onClick={handleConfirm}>
            {t("confirmCta")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
