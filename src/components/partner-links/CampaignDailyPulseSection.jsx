"use client";

/**
 * CampaignDailyPulseSection — second sidebar section of the campaign
 * partner-link breakdown overlay. Three stacked sparklines (Clicks /
 * Conversions / Conv. rate) over the last 14 days + today's value +
 * delta vs the previous 7-day average. Footer surfaces best + quiet
 * day in the window.
 *
 * Pattern: Vercel project Analytics overview / Mercury account-overview
 * — three rows with label, today's value, delta pill, and an inline
 * sparkline. The whole point is "is this campaign accelerating,
 * plateauing, or dying?" answerable in 2 seconds.
 *
 * Sparklines use the shared `Sparkline` primitive (recharts under the
 * hood) in inline mode. Tone reflects delta direction so the visual
 * tracks the headline number.
 */

import { useQuery } from "@tanstack/react-query";
import { useTranslations, useLocale } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import Sparkline from "@/components/shared/analytics/Sparkline";
import { fetchCampaignDailyPulse } from "@/lib/mock/company-stats";
import { formatNumber } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

export default function CampaignDailyPulseSection({ campaignId, isVisible }) {
  const t = useTranslations("PartnerLinksPerf.pulse");
  const locale = useLocale();

  const { data: pulse, isLoading } = useQuery({
    queryKey: ["campaign-daily-pulse", campaignId],
    queryFn: () => fetchCampaignDailyPulse({ campaignId, days: 14 }),
    enabled: isVisible && !!campaignId,
  });

  if (isLoading || !pulse) return <PulseSkeleton t={t} />;

  return (
    <div className="flex flex-col gap-[1em]">
      <p className="text-[0.8125em] text-text-secondary leading-[1.5] max-w-[40em]">
        {t("body")}
      </p>

      <div className="flex flex-col bg-surface border border-border-light rounded-[0.625em] divide-y divide-border-light">
        <PulseRow
          label={t("series.clicks")}
          today={formatNumber(pulse.today.clicks)}
          delta={pulse.delta_vs_7d_avg.clicks}
          deltaKind="pct"
          series={pulse.series.clicks}
          t={t}
        />
        <PulseRow
          label={t("series.conversions")}
          today={formatNumber(pulse.today.conversions)}
          delta={pulse.delta_vs_7d_avg.conversions}
          deltaKind="pct"
          series={pulse.series.conversions}
          t={t}
        />
        <PulseRow
          label={t("series.convRate")}
          today={`${pulse.today.conv_rate}%`}
          delta={pulse.delta_vs_7d_avg.conv_rate}
          deltaKind="pp"
          series={pulse.series.conv_rate}
          t={t}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[0.625em]">
        <DayMarker
          label={t("topDay")}
          tone="positive"
          date={pulse.top_day.date}
          locale={locale}
          clicks={pulse.top_day.clicks}
          conversions={pulse.top_day.conversions}
          t={t}
        />
        <DayMarker
          label={t("quietDay")}
          tone="muted"
          date={pulse.quiet_day.date}
          locale={locale}
          clicks={pulse.quiet_day.clicks}
          conversions={pulse.quiet_day.conversions}
          t={t}
        />
      </div>
    </div>
  );
}

function PulseRow({ label, today, delta, deltaKind, series, t }) {
  const tone = delta > 0 ? "positive" : delta < 0 ? "negative" : "muted";
  return (
    <div className="flex items-center gap-[1em] px-[1em] py-[0.875em]">
      <div className="flex flex-col gap-[0.125em] min-w-0 flex-1">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
          {label}
        </span>
        <span className="font-mono text-[1.125em] font-semibold tabular-nums text-text">
          {today}
        </span>
        <DeltaPill delta={delta} kind={deltaKind} t={t} />
      </div>
      <Sparkline
        data={series.length >= 2 ? series : [...series, ...series]}
        mode="inline"
        tone={tone}
        width="9em"
        height="2.5em"
      />
    </div>
  );
}

function DeltaPill({ delta, kind, t }) {
  const Icon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const tone =
    delta > 0
      ? "text-trend-positive"
      : delta < 0
        ? "text-trend-negative"
        : "text-text-muted";
  const label =
    delta === 0
      ? t("delta.flat")
      : kind === "pp"
        ? t("delta.pp", { value: Math.abs(delta) })
        : t("delta.pct", { value: Math.abs(delta) });
  return (
    <span className={cn("inline-flex items-center gap-[0.25em] text-[0.6875em] font-semibold font-body", tone)}>
      <Icon className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
      {label}
    </span>
  );
}

function DayMarker({ label, tone, date, locale, clicks, conversions, t }) {
  const fmt = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const dotTone =
    tone === "positive" ? "bg-trend-positive" : "bg-text-muted";
  return (
    <div className="flex items-center gap-[0.625em] px-[0.875em] py-[0.625em] rounded-[0.5em] bg-surface border border-border-light">
      <span className={cn("shrink-0 w-[0.5em] h-[0.5em] rounded-full", dotTone)} />
      <div className="flex flex-col gap-[0.0625em] min-w-0">
        <span className="text-[0.6875em] font-semibold tracking-[0.06em] uppercase text-text-muted">
          {label}
        </span>
        <span className="text-[0.8125em] font-semibold text-text font-body">
          {fmt.format(new Date(date))}
        </span>
        <span className="text-[0.6875em] text-text-muted font-mono tabular-nums">
          {t("dayMeta", { clicks, conversions })}
        </span>
      </div>
    </div>
  );
}

function PulseSkeleton({ t }) {
  return (
    <div className="flex flex-col gap-[1em]">
      <p className="text-[0.8125em] text-text-secondary leading-[1.5]">
        {t("body")}
      </p>
      <div className="flex flex-col bg-surface border border-border-light rounded-[0.625em] divide-y divide-border-light">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-[1em] px-[1em] py-[0.875em]">
            <div className="flex flex-col gap-[0.25em] flex-1">
              <span className="block h-[0.5em] w-[6em] rounded-[0.25em] bg-bg-alt animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
              <span className="block h-[0.875em] w-[4em] rounded-[0.25em] bg-bg-alt animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
            </div>
            <span className="block h-[2.5em] w-[9em] rounded-[0.25em] bg-bg-alt animate-[skeleton-pulse_1.4s_ease-in-out_infinite]" />
          </div>
        ))}
      </div>
    </div>
  );
}
