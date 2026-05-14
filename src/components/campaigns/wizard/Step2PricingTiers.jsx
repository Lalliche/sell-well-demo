"use client";

"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Info } from "lucide-react";
import { TextInput } from "@/components/ui/FormInputs";
import Popover from "@/components/shared/overlays/Popover";
import StepSection from "./StepSection";
import { cn } from "@/lib/utils";

let _uid = 1;
function uid() { return `tier-${_uid++}`; }

export default function Step2PricingTiers({ form, setForm, errors = {}, clearError }) {
  const t = useTranslations("Campaigns.wizard.step2");
  const isMulti = form.pricing_tiers.length > 1;
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef(null);

  const patch = (id, key, errorKey) => (val) => {
    if (errorKey) clearError?.(errorKey);
    setForm((f) => ({
      ...f,
      pricing_tiers: f.pricing_tiers.map((tier) =>
        tier.id === id ? { ...tier, [key]: val } : tier,
      ),
    }));
  };

  const addTier = () =>
    setForm((f) => ({
      ...f,
      pricing_tiers: [...f.pricing_tiers, { id: uid(), name: "", price: "" }],
    }));

  const removeTier = (id) =>
    setForm((f) => ({
      ...f,
      pricing_tiers: f.pricing_tiers.filter((tier) => tier.id !== id),
    }));

  return (
    <div className="flex flex-col gap-[1.5em]">
      <StepSection title={t("sectionTiers")}>

        {/* Single-tier mode — label above, then input + button + info icon
            all on one perfectly-aligned row, helper text below. */}
        {!isMulti && (
          <div className="flex flex-col gap-[0.375em]">
            {/* Label row */}
            <span className="text-[0.875em] font-medium text-text">
              {t("fixedPrice")}
              <span className="text-status-rejected-text ml-[0.25em]">*</span>
            </span>

            {/* Input + button + info — all items-center on one row */}
            <div className="flex items-center gap-[0.75em]">
              <div className="flex-1">
                <TextInput
                  placeholder={t("pricePlaceholder")}
                  value={form.pricing_tiers[0].price}
                  onChange={patch(form.pricing_tiers[0].id, "price", "tier_price_0")}
                  type="number"
                  errorMessage={errors["tier_price_0"]}
                />
              </div>

              <button
                type="button"
                onClick={addTier}
                className={cn(
                  "shrink-0 inline-flex items-center gap-[0.375em] h-[2.75em] px-[0.875em] rounded-[0.5em]",
                  "border border-border text-[0.8125em] font-semibold text-accent-text bg-surface",
                  "hover:border-accent/40 hover:bg-accent-light",
                  "transition-[background-color,border-color] duration-150 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
                )}
              >
                <Plus size="0.875em" strokeWidth={2.25} />
                {t("addTier")}
              </button>

              {/* Info icon — click opens an absolutely-positioned popover */}
              <div className="relative shrink-0">
                <button
                  ref={infoRef}
                  type="button"
                  onClick={() => setInfoOpen((v) => !v)}
                  aria-label={t("addTierInfoAriaLabel")}
                  className="inline-flex items-center justify-center text-accent hover:text-accent-hover transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border] rounded-full"
                >
                  <Info size="1.125em" strokeWidth={1.75} />
                </button>
                <Popover
                  open={infoOpen}
                  onClose={() => setInfoOpen(false)}
                  triggerRef={infoRef}
                  align="right"
                  placement="bottom"
                  className="w-[18em] p-[1em]"
                >
                  <p className="text-[0.8125em] text-text-secondary leading-[1.55]">
                    {t("addTierInfo")}
                  </p>
                </Popover>
              </div>
            </div>

            {/* Helper text below the row */}
            {!errors["tier_price_0"] && (
              <span className="text-[0.75em] text-text-muted">
                {t("fixedPriceHelper")}
              </span>
            )}
          </div>
        )}

        {/* Multi-tier mode — name + price columns with remove buttons */}
        {isMulti && (
          <div className="flex flex-col gap-[0.75em]">
            <div className="grid grid-cols-[1fr_1fr_2.5em] gap-[0.75em] items-center">
              <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
                {t("colName")}
              </span>
              <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
                {t("colPrice")}
              </span>
              <span />
            </div>

            {form.pricing_tiers.map((tier, idx) => (
              <div key={tier.id} className="grid grid-cols-[1fr_1fr_2.5em] gap-[0.75em] items-start">
                <TextInput
                  placeholder={t("tierNamePlaceholder", { n: idx + 1 })}
                  value={tier.name}
                  onChange={patch(tier.id, "name")}
                />
                <TextInput
                  placeholder={t("pricePlaceholder")}
                  value={tier.price}
                  onChange={patch(tier.id, "price", `tier_price_${idx}`)}
                  type="number"
                  required
                  errorMessage={errors[`tier_price_${idx}`]}
                />
                <button
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  disabled={form.pricing_tiers.length <= 1}
                  aria-label={t("removeTier")}
                  className={cn(
                    "inline-flex items-center justify-center w-[2.5em] h-[2.75em] rounded-[0.5em]",
                    "text-text-muted hover:text-status-rejected-text hover:bg-status-rejected-bg",
                    "transition-[color,background-color] duration-150 ease-out",
                    "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent",
                  )}
                >
                  <Trash2 size="0.875em" strokeWidth={1.75} />
                </button>
              </div>
            ))}

            {/* Add more tiers in multi mode */}
            <button
              type="button"
              onClick={addTier}
              className={cn(
                "inline-flex items-center gap-[0.375em] self-start",
                "text-[0.8125em] font-semibold text-accent-text hover:text-accent",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border] rounded-[0.25em]",
              )}
            >
              <Plus size="0.875em" strokeWidth={2.25} />
              {t("addTier")}
            </button>
          </div>
        )}
      </StepSection>

      {!isMulti && (
        <div className="flex items-start gap-[0.625em] p-[0.875em] bg-bg-alt rounded-[0.5em] border border-border-light text-[0.8125em] text-text-muted leading-[1.55]">
          <span className="shrink-0 mt-[0.125em]">💡</span>
          <p>{t("singleTierTip")}</p>
        </div>
      )}
    </div>
  );
}
