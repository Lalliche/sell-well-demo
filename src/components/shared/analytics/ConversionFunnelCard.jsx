/**
 * ConversionFunnelCard — Lead pipeline visualization card.
 * Layout per stage: icon | bar (grows, pushes label right) | count label sits right of bar edge.
 * No background track — bar grows into open space. % centered inside bar.
 * Animates on scroll-into-view, 1100ms ease per stage with stagger.
 *
 * Props:
 *   stages    Array<{ label: string, count: number, icon?: ReactNode }>
 *   title     string (default: "Lead Funnel")
 *   className string
 */

"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FiSend, FiEye, FiCheckCircle } from "react-icons/fi";

const DEFAULT_ICONS = [
  <FiSend key="send" size="1em" strokeWidth={1.5} />,
  <FiEye key="eye" size="1em" strokeWidth={1.5} />,
  <FiCheckCircle key="check" size="1em" strokeWidth={1.5} />,
];

const STAGE_COLORS = [
  "bg-accent",
  "bg-[#7A9FDD]",
  "bg-trend-positive",
];

export default function ConversionFunnelCard({
  stages    = [],
  title     = "Lead Funnel",
  className,
}) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setAnimated(true); observer.disconnect(); } },
      { threshold: 0.2 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const max = stages[0]?.count || 1;

  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[1.125em] shadow-xs",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
          {title}
        </span>
        {stages.length >= 2 && (
          <span className="text-[0.75em] font-semibold font-mono text-trend-positive">
            {stages[0].count > 0
              ? `${((stages[stages.length - 1].count / stages[0].count) * 100).toFixed(1)}% overall`
              : "—"}
          </span>
        )}
      </div>

      {/* Stages */}
      <div className="flex flex-col gap-[0.75em]">
        {stages.map((stage, i) => {
          const pct   = max > 0 ? (stage.count / max) * 100 : 0;
          const color = STAGE_COLORS[i % STAGE_COLORS.length];
          const icon  = stage.icon ?? DEFAULT_ICONS[i] ?? DEFAULT_ICONS[0];

          return (
            <div key={stage.label} className="flex items-center gap-[0.75em]">

              {/* Left icon */}
              <span className="shrink-0 text-text-muted w-[1.25em] flex justify-center">
                {icon}
              </span>

              {/* Bar + label move as one unit */}
              <div className="flex-1 flex items-center overflow-hidden">

                {/* Bar */}
                <div
                  className={cn("h-[1.75em] rounded-[0.375em] flex items-center justify-center shrink-0", color)}
                  style={{
                    width: animated ? `calc(${pct}% - 7em)` : "0%",
                    minWidth: animated && pct > 0 ? "3em" : "0",
                    transition: `width 1100ms cubic-bezier(0.4,0,0.2,1)`,
                    transitionDelay: `${i * 120}ms`,
                  }}
                >
                  <span className="text-white text-[0.875em] font-semibold font-mono tabular-nums select-none whitespace-nowrap px-[0.5em]">
                    {Math.round(pct)}%
                  </span>
                </div>

                {/* Label — sits flush right of bar */}
                <div
                  className="shrink-0 flex items-baseline gap-[0.375em] pl-[0.75em] whitespace-nowrap"
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: `opacity 400ms ease`,
                    transitionDelay: `${i * 120 + 400}ms`,
                  }}
                >
                  <span className="font-semibold font-mono tabular-nums text-text text-[0.9375em]">
                    {stage.count.toLocaleString()}
                  </span>
                  <span className="text-[0.8125em] text-text-muted font-body">{stage.label}</span>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
