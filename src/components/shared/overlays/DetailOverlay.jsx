/**
 * DetailOverlay — Smart two-pane overlay. Flow/settings-style.
 * Left: sidebar with labelled nav sections. Right: content for the active section.
 * Feels like a mini-dashboard, not a modal.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   title       string — entity name shown in sidebar header (e.g. "Ahmed Benali")
 *   subtitle    string — secondary line under title (e.g. "Atlas CRM · Submitted Apr 15")
 *   avatar      ReactNode — optional avatar/logo shown in sidebar header
 *   sections    Array<OverlaySection> — nav items + their content
 *   footer      ReactNode — optional bottom bar (approve/reject buttons etc.)
 *   defaultSection string — key of the section to show on open (default: first)
 *
 * OverlaySection shape:
 *   { key: string, label: string, icon?: ReactNode, content: ReactNode }
 *
 * Animation: opacity + scale, 200ms. Backdrop blur.
 */

"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { FiX } from "react-icons/fi";

const ENTER_MS = 200;
const EXIT_MS  = 150;

export default function DetailOverlay({
  open,
  onClose,
  title,
  subtitle,
  avatar,
  sections = [],
  footer,
  defaultSection,
}) {
  const [phase, setPhase]       = useState("closed");
  const [active, setActive]     = useState(defaultSection ?? sections[0]?.key ?? "");
  const panelRef                = useRef(null);

  const handleClose = useCallback(() => {
    setPhase("exiting");
    setTimeout(() => { setPhase("closed"); onClose?.(); }, EXIT_MS);
  }, [onClose]);

  useEffect(() => {
    if (open && phase === "closed") {
      const raf = requestAnimationFrame(() => {
        setActive(defaultSection ?? sections[0]?.key ?? "");
        setPhase("before");
        requestAnimationFrame(() => setPhase("open"));
      });
      return () => cancelAnimationFrame(raf);
    }
    if (!open && (phase === "open" || phase === "before")) handleClose();
  }, [open]);

  useEffect(() => {
    if (phase === "closed") return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [phase, handleClose]);

  useEffect(() => {
    if (phase === "open") panelRef.current?.focus();
  }, [phase]);

  if (phase === "closed") return null;

  const isOpen = phase === "open";
  const hasT   = phase !== "before";
  const dur    = phase === "exiting" ? `${EXIT_MS}ms` : `${ENTER_MS}ms`;

  const activeSection = sections.find((s) => s.key === active) ?? sections[0];

  return createPortal(
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-[1.5em]"
      style={{ pointerEvents: phase === "before" ? "none" : "auto" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={handleClose}
        aria-hidden="true"
        style={{
          background: "rgba(26,26,26,0.35)",
          opacity: isOpen ? 1 : 0,
          transition: hasT ? `opacity ${dur} ease` : "none",
        }}
      />

      {/* Two-pane panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-overlay-title"
        className="relative w-full flex rounded-[0.75em] overflow-hidden outline-none"
        style={{
          maxWidth: "min(90vw, 68em)",
          height: "min(88vh, 42em)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "scale(1) translateY(0)" : "scale(0.97) translateY(0.5em)",
          transition: hasT
            ? `opacity ${dur} ease, transform ${dur} cubic-bezier(0.4,0,0.2,1)`
            : "none",
        }}
      >
        {/* ── Left sidebar ──────────────────────────────────────────── */}
        <aside className="flex flex-col bg-bg-alt border-r border-border-light shrink-0" style={{ width: "13em" }}>

          {/* Entity header */}
          <div className="px-[1em] pt-[1.25em] pb-[1em] border-b border-border-light">
            {avatar && (
              <div className="mb-[0.625em]">{avatar}</div>
            )}
            <p
              id="detail-overlay-title"
              className="font-heading text-[0.9375em] font-semibold text-text leading-snug line-clamp-2"
            >
              {title}
            </p>
            {subtitle && (
              <p className="text-[0.75em] text-text-muted font-body mt-[0.2em] leading-snug line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-[0.5em]">
            {sections.map((s) => {
              const isAct = s.key === active;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  className={cn(
                    "flex items-center gap-[0.625em] mx-[0.5em] px-[0.75em] py-[0.5em] text-left rounded-[0.5em]",
                    "w-[calc(100%-1em)]",
                    "text-[0.8125em] font-medium font-body",
                    "transition-[background-color,color] duration-100",
                    "focus-visible:outline-none focus-visible:bg-surface",
                    isAct
                      ? "bg-surface text-text shadow-xs"
                      : "text-text-secondary hover:bg-surface/60 hover:text-text",
                  )}
                >
                  {s.icon && (
                    <span className={cn("shrink-0", isAct ? "text-accent" : "text-text-muted")}>
                      {s.icon}
                    </span>
                  )}
                  {s.label}
                </button>
              );
            })}
          </nav>

          {/* Close at bottom of sidebar */}
          <div className="shrink-0 px-[1em] py-[0.75em] border-t border-border-light">
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className={cn(
                "w-full flex items-center gap-[0.5em] px-[0.75em] py-[0.5em] rounded-[0.375em]",
                "text-[0.8125em] font-medium text-text-muted",
                "hover:bg-surface hover:text-text",
                "transition-[background-color,color] duration-100",
                "focus-visible:outline-none focus-visible:bg-surface",
              )}
            >
              <FiX size="0.875em" strokeWidth={2} />
              Close
            </button>
          </div>
        </aside>

        {/* ── Right content ─────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 bg-surface min-w-0">

          {/* Scrollable area — header + body scroll together */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-[2em] p-[3em]">
            <div className="flex items-center gap-[0.5em]">
              {activeSection?.icon && (
                <span className="text-text-muted">{activeSection.icon}</span>
              )}
              <h2 className="font-heading text-[1.25em] font-bold text-text tracking-[-0.02em]">
                {activeSection?.label}
              </h2>
            </div>
            <div className="bg-bg-alt rounded-[0.75em] p-[1em]">
              {activeSection?.content}
            </div>
          </div>

          {/* Footer — fixed to bottom, never scrolls */}
          {footer && (
            <div className="shrink-0 flex items-center justify-end gap-[0.75em] px-[2em] py-[1em] border-t border-border-light bg-surface">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
