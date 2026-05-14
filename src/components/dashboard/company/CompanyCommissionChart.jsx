"use client";

/**
 * Commissions-paid area chart — company-side dashboard.
 *
 * Mirrors the partner-side `CommissionChart` (same recharts setup, same glow
 * filter, same dual-series current+previous overlay) but reads from the
 * `Dashboard.CompanyDashboard.chart.*` i18n namespace and labels its hero
 * total as "Commissions paid" instead of "Commissions earned".
 *
 * Range toggle: 7d / 30d / 90d / 12m. Range state is owned by the parent
 * (so the parent can use the toggle as a React Query key).
 *
 * Two series in `data`:
 *   `current`  — accent-stroked, glow-filtered, area-filled (the hero line)
 *   `previous` — muted dashed line (offset back one period for comparison)
 */

import { useTranslations, useLocale } from "next-intl";
import {
  Area, AreaChart, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";
import { format as formatDZD, formatCompact } from "@/lib/format/currency";

const RANGES = ["7d", "30d", "90d", "12m"];

export default function CompanyCommissionChart({ data, range, onRangeChange, isLoading }) {
  const t = useTranslations("Dashboard.CompanyDashboard.chart");
  const total = (data ?? []).reduce((acc, d) => acc + (d.current ?? 0), 0);

  return (
    <div className="bg-surface border border-border-light rounded-[0.75em] shadow-xs p-[1.25em] flex flex-col gap-[1em] h-full">
      <div className="flex items-start justify-between gap-[0.75em] flex-wrap">
        <div className="flex flex-col gap-[0.25em]">
          <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
            {t("title")}
          </span>
          <span className="font-mono text-[1.5em] font-semibold tabular-nums leading-none text-text">
            {formatDZD(total)}
          </span>
          <span className="text-[0.75em] text-text-muted">
            {t(`subtitle.${range}`)}
          </span>
        </div>
        <RangeToggle value={range} onChange={onRangeChange} />
      </div>

      {/* Explicit pixel-equivalent height — `h-full` only works when a
          parent constrains its height, and this chart sits standalone in
          the dashboard composition. Locking to 18em keeps the band slim
          on a wide page (matches Stripe / Mercury height proportions). */}
      <div className="h-[18em] w-full">
        {isLoading ? (
          <div className="h-full w-full rounded-[0.5em] bg-bg-alt animate-pulse" />
        ) : (data?.length ?? 0) > 1 ? (
          <Chart data={data} range={range} />
        ) : (
          <Empty />
        )}
      </div>
    </div>
  );
}

function RangeToggle({ value, onChange }) {
  const t = useTranslations("Dashboard.CompanyDashboard.chart.range");
  return (
    <div role="tablist" className="flex items-center gap-[0.125em] bg-bg-alt rounded-[0.5em] p-[0.1875em]">
      {RANGES.map((r) => {
        const active = r === value;
        return (
          <button
            key={r}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(r)}
            className={cn(
              "px-[0.625em] py-[0.25em] rounded-[0.375em] text-[0.75em] font-semibold",
              "transition-[background-color,color] duration-150 ease-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
              active
                ? "bg-surface text-text shadow-xs"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            {t(r)}
          </button>
        );
      })}
    </div>
  );
}

function Chart({ data, range }) {
  const locale = useLocale();
  const isMonthly = range === "12m";

  const formatTick = (iso) => {
    const d = new Date(iso);
    if (isMonthly) {
      return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "short" });
    }
    return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      month: "short", day: "numeric",
    });
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="company-commission-current" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-accent)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="company-commission-previous" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="var(--color-text-muted)" stopOpacity={0.12} />
            <stop offset="100%" stopColor="var(--color-text-muted)" stopOpacity={0} />
          </linearGradient>
          <filter id="company-commission-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <CartesianGrid stroke="var(--color-border-light)" vertical={false} />

        <XAxis
          dataKey="dateISO"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          tickFormatter={formatTick}
          minTickGap={32}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
          tickFormatter={(v) => formatCompact(v, { withSymbol: false })}
          width={48}
        />

        <Tooltip
          content={<TooltipContent />}
          cursor={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }}
        />

        <Area
          type="monotone"
          dataKey="previous"
          stroke="var(--color-text-muted)"
          strokeWidth={1.25}
          strokeDasharray="3 3"
          fill="url(#company-commission-previous)"
          isAnimationActive={false}
          dot={false}
          activeDot={false}
        />

        <Area
          type="monotone"
          dataKey="current"
          stroke="var(--color-accent)"
          strokeWidth={2}
          fill="url(#company-commission-current)"
          filter="url(#company-commission-glow)"
          isAnimationActive={false}
          dot={false}
          activeDot={{
            r: 4,
            stroke: "var(--color-accent)",
            strokeWidth: 2,
            fill: "var(--color-surface)",
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function TooltipContent({ active, payload, label }) {
  const t = useTranslations("Dashboard.CompanyDashboard.chart.tooltip");
  if (!active || !payload?.length) return null;
  const cur  = payload.find((p) => p.dataKey === "current")?.value ?? 0;
  const prev = payload.find((p) => p.dataKey === "previous")?.value ?? 0;
  const date = label ? new Date(label) : null;
  const dateLabel = date
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : "";
  return (
    <div className="bg-surface border border-border-light rounded-[0.5em] shadow-md p-[0.625em] flex flex-col gap-[0.375em] min-w-[10em]">
      <span className="text-[0.6875em] uppercase tracking-[0.06em] text-text-muted font-semibold">
        {dateLabel}
      </span>
      <Row dotClass="bg-accent" label={t("current")} value={cur} />
      <Row dotClass="bg-text-muted" label={t("previous")} value={prev} />
    </div>
  );
}

function Row({ dotClass, label, value }) {
  return (
    <div className="flex items-center justify-between gap-[0.875em]">
      <span className="inline-flex items-center gap-[0.375em] text-[0.75em] text-text-secondary">
        <span aria-hidden="true" className={cn("w-[0.5em] h-[0.5em] rounded-full", dotClass)} />
        {label}
      </span>
      <span className="font-mono text-[0.75em] tabular-nums text-text">
        {formatDZD(value)}
      </span>
    </div>
  );
}

function Empty() {
  const t = useTranslations("Dashboard.CompanyDashboard.chart.empty");
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center gap-[0.375em]">
      <span className="text-[0.875em] font-medium text-text">{t("title")}</span>
      <span className="text-[0.75em] text-text-muted max-w-[20em] leading-[1.5]">
        {t("body")}
      </span>
    </div>
  );
}
