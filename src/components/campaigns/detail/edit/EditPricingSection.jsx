"use client";

/**
 * EditPricingSection — tier list editor.
 *
 * Mirrors Step 2 of the wizard: rows of (name, price). At least one tier
 * must remain (you can't sell a campaign with zero pricing tiers); the
 * remove button is disabled when only one row exists.
 *
 * `pricing_tiers` here is a plain array on the form state. Each row keeps
 * its existing `id` (so the backend can diff against the persisted set),
 * and brand-new rows get a temporary `_temp` id we strip on submit.
 */

import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { TextInput } from "@/components/ui/FormInputs";
import { cn } from "@/lib/utils";

let _tempId = -1;
const nextTempId = () => _tempId--;

export default function EditPricingSection({ form, patch, errors }) {
  const t = useTranslations("Campaigns.companyDetail.edit.pricing");
  const tiers = form.pricing_tiers ?? [];

  const setTiers = (next) => patch("pricing_tiers")(next);

  const updateRow = (idx, field, value) => {
    const next = tiers.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
    setTiers(next);
  };

  const removeRow = (idx) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const addRow = () => {
    setTiers([
      ...tiers,
      { id: nextTempId(), name: "", price: "", sort_order: tiers.length },
    ]);
  };

  return (
    <div className="flex flex-col gap-[0.875em]">
      <p className="text-[0.8125em] text-text-secondary leading-[1.55]">
        {t("helper")}
      </p>

      <ul className="flex flex-col gap-[0.625em]">
        {tiers.map((row, idx) => (
          <li
            key={row.id ?? `t-${idx}`}
            className="flex items-end gap-[0.5em]"
          >
            <TextInput
              label={idx === 0 ? t("nameLabel") : null}
              value={row.name ?? ""}
              onChange={(v) => updateRow(idx, "name", v)}
              placeholder={t("namePlaceholder")}
              className="flex-1"
            />
            <TextInput
              label={idx === 0 ? t("priceLabel") : null}
              value={row.price === 0 || row.price ? String(row.price) : ""}
              onChange={(v) => updateRow(idx, "price", v.replace(/[^\d]/g, ""))}
              placeholder="0"
              className="w-[8em]"
              errorMessage={errors[`pricing_tiers.${idx}.price`]}
            />
            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={tiers.length === 1}
              aria-label={t("remove")}
              className={cn(
                "shrink-0 inline-flex items-center justify-center w-[2.75em] h-[2.75em] rounded-[0.5em]",
                "text-text-muted hover:bg-status-rejected-bg hover:text-status-rejected-text",
                "transition-[background-color,color] duration-150 ease-out",
                "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-text-muted",
              )}
            >
              <Trash2 className="w-[1em] h-[1em]" strokeWidth={1.75} />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={addRow}
        className="self-start inline-flex items-center gap-[0.375em] text-[0.8125em] font-semibold text-accent-text hover:text-accent transition-colors duration-150 ease-out"
      >
        <Plus className="w-[1em] h-[1em]" strokeWidth={2} />
        {t("addTier")}
      </button>
    </div>
  );
}
