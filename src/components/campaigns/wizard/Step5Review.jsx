"use client";

import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { fetchCategories } from "@/lib/mock/campaigns";
import { format as formatDZD } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function Step5Review({ form }) {
  const t = useTranslations("Campaigns.wizard.step5");
  const locale = useLocale();
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const categoryLabel = (() => {
    const c = categories.find((c) => c.id === form.category);
    return c ? (locale === "fr" ? c.name_fr : c.name_en) : "—";
  })();

  const commissionLabel =
    form.commission_type === "percentage"
      ? `${form.commission_value}%`
      : formatDZD(Number(form.commission_value));

  const validTiers = form.pricing_tiers.filter(
    (t) => t.name.trim() || String(t.price).trim(),
  );

  return (
    <div className="flex flex-col gap-[1.5em]">
      <p className="text-[0.8125em] text-text-muted">{t("intro")}</p>

      <ReviewRow label={t("productName")} value={form.product_name || "—"} required missing={!form.product_name} />
      <ReviewRow label={t("category")} value={categoryLabel} required missing={!form.category} />
      <ReviewRow
        label={t("commission")}
        value={
          form.commission_value
            ? `${commissionLabel} (${form.commission_type === "percentage" ? t("percentage") : t("flat")})`
            : "—"
        }
        required
        missing={!form.commission_value}
      />
      <ReviewRow
        label={t("trackingWindow")}
        value={t("trackingDays", { days: form.tracking_window_days })}
      />
      <ReviewRow
        label={t("pricingTiers")}
        value={validTiers.length === 0
          ? "—"
          : validTiers.map((tier) =>
              `${tier.name || t("unnamedTier")} — ${tier.price ? formatDZD(Number(tier.price)) : "—"}`
            ).join(" · ")}
        required
        missing={validTiers.length === 0}
      />
      <ReviewRow
        label={t("partnerLinks")}
        value={form.partner_links_enabled ? t("enabled") : t("disabled")}
      />
      {form.partner_links_enabled && (
        <ReviewRow
          label={t("webhookTest")}
          value={form.webhook_tested ? t("passed") : t("notTested")}
          required
          missing={!form.webhook_tested}
          note={!form.webhook_tested ? t("webhookTestRequired") : null}
        />
      )}
      <ReviewRow
        label={t("salesKit")}
        value={(() => {
          const filled = [
            form.sales_kit.pitch_deck && t("pitchDeck"),
            form.sales_kit.one_pager && t("onePager"),
            form.sales_kit.pricing_sheet && t("pricingSheet"),
            form.sales_kit.demo_video_url && t("demoVideo"),
            form.sales_kit.other.filter((o) => o.file).length > 0 &&
              t("otherDocs", { count: form.sales_kit.other.filter((o) => o.file).length }),
          ].filter(Boolean);
          return filled.length > 0 ? filled.join(", ") : t("noDocuments");
        })()}
      />
    </div>
  );
}

function ReviewRow({ label, value, required, missing, note }) {
  return (
    <div className="flex items-start gap-[1em] py-[0.625em] border-b border-border-light last:border-0">
      <span className="w-[10em] shrink-0 text-[0.8125em] font-semibold text-text-muted">
        {label}
      </span>
      <div className="flex-1 flex items-start gap-[0.5em] min-w-0">
        <span className={cn(
          "text-[0.8125em] leading-[1.5]",
          missing ? "text-status-rejected-text" : "text-text",
        )}>
          {value}
        </span>
        {required && missing && (
          <AlertCircle size="0.875em" strokeWidth={2} className="shrink-0 mt-[0.125em] text-status-rejected-text" />
        )}
        {required && !missing && (
          <CheckCircle2 size="0.875em" strokeWidth={2} className="shrink-0 mt-[0.125em] text-trend-positive" />
        )}
      </div>
      {note && (
        <p className="w-full text-[0.75em] text-status-rejected-text mt-[0.125em] pl-[11em]">{note}</p>
      )}
    </div>
  );
}
