"use client";

/**
 * ContactClientDialog — log a single outreach attempt against a disputed lead.
 *
 * Three required fields: outreach method (email / phone / sms),
 * result (pending / no_answer / reached_confirmed_sale / reached_no_sale),
 * and admin notes (free text). Appends one `LeadVerification` row via
 * `logOutreach(slug, payload)` in the parent.
 *
 * Logging "reached" outcomes here does NOT auto-resolve the dispute — admin
 * still needs to click Rule sale / Rule no sale on the action rail. This
 * keeps the audit trail explicit: outreach is recorded; the ruling is a
 * separate, deliberate decision.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import AppButton from "@/components/ui/Buttons";
import { TextArea, DropdownInput } from "@/components/ui/FormInputs";
import { useToast } from "@/hooks/useToast";

const METHODS = ["email", "phone", "sms"];
const RESULTS = ["pending", "no_answer", "reached_confirmed_sale", "reached_no_sale"];

export default function ContactClientDialog({ open, onCancel, onConfirm }) {
  const t = useTranslations("Admin.disputes.contactDialog");
  const tCommon = useTranslations("Common");
  const { toast } = useToast();

  const [method, setMethod] = useState("email");
  const [result, setResult] = useState("pending");
  const [notes, setNotes] = useState("");
  const [touched, setTouched] = useState(false);

  if (!open) return null;

  const notesValid = notes.trim().length >= 10;

  const handleConfirm = () => {
    setTouched(true);
    if (!notesValid) {
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
      return;
    }
    onConfirm({ method, result, notes: notes.trim() });
    // Reset for next open
    setMethod("email"); setResult("pending"); setNotes(""); setTouched(false);
  };

  const handleCancel = () => {
    onCancel();
    setMethod("email"); setResult("pending"); setNotes(""); setTouched(false);
  };

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
      <div className="w-full max-w-[32em] bg-surface rounded-[0.75em] shadow-xl p-[2em] flex flex-col gap-[1em]">
        <header className="flex flex-col gap-[0.375em]">
          <h2 className="font-heading text-[1.0625em] font-semibold text-text">
            {t("title")}
          </h2>
          <p className="text-[0.875em] text-text-secondary leading-[1.55]">
            {t("body")}
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1em]">
          <DropdownInput
            label={t("methodLabel")}
            value={method}
            onChange={setMethod}
            options={METHODS.map((m) => ({ value: m, label: t(`method.${m}`) }))}
          />
          <DropdownInput
            label={t("resultLabel")}
            value={result}
            onChange={setResult}
            options={RESULTS.map((r) => ({ value: r, label: t(`result.${r}`) }))}
          />
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
          <AppButton variant="primary" size="md" onClick={handleConfirm}>
            {t("confirmCta")}
          </AppButton>
        </div>
      </div>
    </div>
  );
}
