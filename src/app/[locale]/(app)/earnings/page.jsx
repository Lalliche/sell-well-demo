"use client";

import { useTranslations } from "next-intl";

export default function EarningsPage() {
  const t = useTranslations("Dashboard.Earnings");
  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[0.75em]">
      <h1 className="font-heading text-[1.5em] font-semibold text-text tracking-[-0.02em]">
        {t("title")}
      </h1>
      <p className="text-[0.875em] text-text-muted">
        {t("description")}
      </p>
    </div>
  );
}
