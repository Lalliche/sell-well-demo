"use client";

/**
 * EditCommissionSection — commission type, value, tracking window.
 *
 * Mirrors Step 3 of the wizard but doesn't touch the Partner Links
 * subsection (that lives in EditPartnerLinksSection so it reads as its
 * own concern in the overlay sidebar).
 */

import { useTranslations } from "next-intl";
import { TextInput, DropdownInput } from "@/components/ui/FormInputs";
import { cn } from "@/lib/utils";

export default function EditCommissionSection({ form, patch, errors }) {
  const t = useTranslations("Campaigns.companyDetail.edit.commission");

  const trackingOptions = [30, 60, 90].map((d) => ({
    value: d,
    label: t("trackingDays", { days: d }),
  }));

  return (
    <div className="flex flex-col gap-[1em]">
      <div className="flex flex-col gap-[0.375em]">
        <span className="text-[0.875em] font-medium text-text">{t("typeLabel")}</span>
        <div className="grid grid-cols-2 gap-[0.5em]">
          {["percentage", "flat"].map((opt) => {
            const active = form.commission_type === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => patch("commission_type")(opt)}
                className={cn(
                  "flex flex-col items-start gap-[0.125em] px-[0.875em] py-[0.625em] rounded-[0.5em] border text-left",
                  "transition-[background-color,border-color] duration-150 ease-out",
                  active
                    ? "bg-accent-light border-accent text-accent-text"
                    : "bg-surface border-border text-text hover:bg-surface-hover",
                )}
              >
                <span className="text-[0.875em] font-semibold">{t(`type.${opt}.label`)}</span>
                <span className="text-[0.6875em] text-text-muted">
                  {t(`type.${opt}.helper`)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <TextInput
        label={
          form.commission_type === "percentage"
            ? t("valueLabelPct")
            : t("valueLabelFlat")
        }
        value={
          form.commission_value === 0 || form.commission_value
            ? String(form.commission_value)
            : ""
        }
        onChange={(v) => patch("commission_value")(v.replace(/[^\d.]/g, ""))}
        placeholder="0"
        helperText={
          form.commission_type === "percentage"
            ? t("valueHelperPct")
            : t("valueHelperFlat")
        }
        errorMessage={errors.commission_value}
        required
      />

      <DropdownInput
        label={t("trackingWindowLabel")}
        options={trackingOptions}
        value={form.tracking_window_days}
        onChange={patch("tracking_window_days")}
        helperText={t("trackingWindowHelper")}
        required
      />
    </div>
  );
}
