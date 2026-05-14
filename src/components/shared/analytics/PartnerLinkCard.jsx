/**
 * PartnerLinkCard — Per-link analytics card for a Sales Partner's generated link.
 * Shows clicks, conversions, rate as a tall animated bar (like the reference usage card),
 * commission earned, and a copy button.
 *
 * Props:
 *   campaign      string — campaign/product name
 *   url           string — the full partner link URL
 *   clicks        number
 *   conversions   number
 *   commission    number — total commission earned in DA
 *   onCopy        () => void
 *   className     string
 */

"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FiCopy, FiCheck, FiExternalLink } from "react-icons/fi";

function fmt(n) {
  return `DZD ${Number(n).toLocaleString("fr-DZ")}`;
}

export default function PartnerLinkCard({
  campaign,
  url,
  clicks      = 0,
  conversions = 0,
  commission  = 0,
  onCopy,
  className,
}) {
  const [copied,   setCopied]   = useState(false);
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

  const rate    = clicks > 0 ? ((conversions / clicks) * 100).toFixed(1) : "0.0";
  const fillPct = clicks > 0 ? Math.min(100, (conversions / clicks) * 100) : 0;
  const showPct = fillPct >= 18;

  const handleCopy = () => {
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[1em] shadow-xs",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-[0.75em]">
        <div className="flex flex-col gap-[0.125em] min-w-0">
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body">
            Partner Link
          </span>
          <span className="text-[0.9375em] font-semibold text-text font-heading leading-snug truncate">
            {campaign}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy link"
          className={cn(
            "shrink-0 flex items-center gap-[0.3em] h-[2em] px-[0.625em] rounded-[0.375em] border text-[0.75em] font-medium font-body",
            "transition-[background-color,color,border-color] duration-150",
            copied
              ? "bg-[#EDF5F0] border-[#2D6A4F] text-[#2D6A4F]"
              : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text",
          )}
        >
          {copied ? <FiCheck size="0.8em" strokeWidth={2.5} /> : <FiCopy size="0.8em" strokeWidth={2} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* URL */}
      <div className="flex items-center gap-[0.375em] text-[0.75em] text-text-muted font-mono truncate">
        <FiExternalLink size="0.8em" strokeWidth={1.5} className="shrink-0" />
        <span className="truncate">{url}</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-[0.8125em] font-body">
        <span className="text-text-secondary">{conversions} conversions · {clicks} clicks</span>
        <span className="font-semibold font-mono text-accent">{rate}%</span>
      </div>

      {/* Tall animated bar */}
      <div className="h-[1.75em] bg-bg-alt rounded-[0.375em] overflow-hidden">
        <div
          className="h-full bg-accent rounded-[0.375em] flex items-center justify-end pr-[0.625em]"
          style={{
            width: animated ? `${fillPct}%` : "0%",
            minWidth: animated && fillPct > 0 ? "2em" : "0",
            transition: "width 1100ms cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {showPct && (
            <span className="text-white text-[0.75em] font-semibold font-mono tabular-nums">
              {rate}%
            </span>
          )}
        </div>
      </div>

      {/* Commission */}
      <div className="flex items-center justify-between border-t border-border-light pt-[0.875em]">
        <span className="text-[0.75em] text-text-muted font-body uppercase tracking-[0.05em]">Commission earned</span>
        <span className="text-[1em] font-semibold font-mono tabular-nums text-accent">{fmt(commission)}</span>
      </div>
    </div>
  );
}
