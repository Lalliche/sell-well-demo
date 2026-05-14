"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * StepSection — titled card section within a wizard step.
 * Keeps each step visually chunked without adding extra borders.
 */
export default function StepSection({ title, optional, children }) {
  const t = useTranslations("Campaigns.wizard");
  return (
    <div className="flex flex-col gap-[1em]">
      <div className="flex items-center gap-[0.5em]">
        <h3 className="font-heading font-semibold text-[0.9375em] tracking-[-0.01em] text-text">
          {title}
        </h3>
        {optional && (
          <span className="inline-flex items-center h-[1.375em] px-[0.5em] rounded-full bg-bg-alt text-text-muted text-[0.6875em] font-semibold uppercase tracking-[0.04em]">
            {t("optional")}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-[1em]">
        {children}
      </div>
    </div>
  );
}
