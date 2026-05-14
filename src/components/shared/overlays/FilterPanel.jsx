/**
 * FilterPanel — Anchored popover that drops below the Filters button.
 * Linear/Attio-style: no overlay, no modal. Anchored to a trigger ref,
 * dismissed by clicking outside. Results update live behind it.
 *
 * Usage:
 *   const triggerRef = useRef(null);
 *   <button ref={triggerRef} onClick={() => setOpen(true)}>Filters</button>
 *   <FilterPanel triggerRef={triggerRef} open={open} onClose={...} ... />
 *
 * Props:
 *   triggerRef      React ref — the button that opened the panel (used for positioning)
 *   open            boolean
 *   onClose         () => void
 *   onApply         (filters: object) => void — called on every chip toggle (live)
 *   onReset         () => void
 *   sections        Array<FilterSection>
 *   activeCount     number
 *   initialValues   object
 *
 * FilterSection shape:
 *   { key, label, type: "chips"|"range"|"numberInput",
 *     options?, singleSelect?,        // chips (singleSelect: clicking a chip
 *                                     //  replaces the selection instead of
 *                                     //  appending; clicking the active one
 *                                     //  clears it. Caller still sees an
 *                                     //  array payload, just always 0/1 long)
 *     min?, max?, step?, unit?,       // range
 *     placeholder?, hidden?, minValue?, // numberInput (minValue clamps the
 *                                       //  parsed number; placeholder shows
 *                                       //  in the empty input)
 *   }
 *
 * FilterOption shape:
 *   { value, label }
 *
 * `numberInput` type stores a single number (not an array) on `localValues`.
 * Use it when you need a free-form integer the user types — e.g. "Minimum
 * flags" with a "Custom" preset chip that toggles `hidden` on this section.
 */

"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FiCheck, FiRotateCcw } from "react-icons/fi";

const ENTER_MS = 150;
const EXIT_MS  = 110;

export default function FilterPanel({
  triggerRef,
  open,
  onClose,
  onApply,
  onReset,
  sections = [],
  activeCount = 0,
  initialValues = {},
}) {
  const tCommon = useTranslations("Common");
  const [phase, setPhase]           = useState("closed");
  const [localValues, setLocalValues] = useState(initialValues);
  const [pos, setPos]               = useState({ top: 0, left: 0, width: 0 });
  const [portalTarget, setPortalTarget] = useState(null);
  const panelRef                    = useRef(null);

  // Walk up from the trigger to find the closest scrollable ancestor.
  // We render the portal into this ancestor (instead of document.body)
  // so the panel scrolls naturally with the content card and gets
  // clipped by its `overflow-hidden` boundary — keeps it inside the
  // dashboard's white content card without needing a scroll listener.
  const findScrollContainer = useCallback(() => {
    if (!triggerRef?.current) return null;
    let node = triggerRef.current.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const oy = style.overflowY;
      if (oy === "auto" || oy === "scroll") return node;
      node = node.parentElement;
    }
    return document.body;
  }, [triggerRef]);

  // Compute position relative to the chosen portal container. Coords
  // are container-relative (offset within the scroll container), so we
  // can use `position: absolute` and let the container's own scroll
  // move the panel along with the trigger naturally.
  const updatePos = useCallback((container) => {
    const target = container ?? portalTarget;
    if (!triggerRef?.current || !target) return;
    const triggerRect   = triggerRef.current.getBoundingClientRect();
    const containerRect = target === document.body
      ? { top: 0, left: 0 }
      : target.getBoundingClientRect();
    const scrollTop  = target === document.body ? window.scrollY : target.scrollTop;
    const scrollLeft = target === document.body ? window.scrollX : target.scrollLeft;
    setPos({
      top:   triggerRect.bottom - containerRect.top  + scrollTop  + 6,
      left:  triggerRect.left   - containerRect.left + scrollLeft,
      width: triggerRect.width,
    });
  }, [triggerRef, portalTarget]);

  const handleClose = useCallback(() => {
    setPhase("exiting");
    setTimeout(() => { setPhase("closed"); onClose?.(); }, EXIT_MS);
  }, [onClose]);

  const applyLive = useCallback((next) => { onApply?.(next); }, [onApply]);

  const toggleChip = (sectionKey, value) => {
    // Compute outside the updater so the setState fn stays pure (calling
    // `applyLive` inside the updater triggers a parent setState during
    // this component's render, which React 19 flags as an error).
    const section = sections.find((s) => s.key === sectionKey);
    const current = localValues[sectionKey] ?? [];
    let nextList;
    if (section?.singleSelect) {
      // Single-select chips: clicking the active chip clears the section;
      // clicking a different one replaces the selection. Caller's
      // `onApply` payload still receives an array shape for consistency.
      nextList = current.includes(value) ? [] : [value];
    } else {
      nextList = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
    }
    const updated = { ...localValues, [sectionKey]: nextList };
    setLocalValues(updated);
    applyLive(updated);
  };

  const handleNumberChange = (sectionKey, raw) => {
    // Parse as integer, allow empty string (treated as `null` so the page
    // can fall back to its default). Clamping is the caller's concern at
    // mock-fn read time.
    const trimmed = String(raw ?? "").trim();
    const next = trimmed === "" ? null : Number(trimmed);
    const updated = { ...localValues, [sectionKey]: Number.isFinite(next) ? next : null };
    setLocalValues(updated);
    applyLive(updated);
  };

  const handleReset = () => {
    const empty = {};
    sections.forEach((s) => {
      if (s.type === "chips") empty[s.key] = [];
      else if (s.type === "range") empty[s.key] = [s.min ?? 0, s.max ?? 100];
      else if (s.type === "numberInput") empty[s.key] = null;
    });
    setLocalValues(empty);
    applyLive(empty);
    onReset?.();
  };

  // Phase machine
  useEffect(() => {
    if (open && phase === "closed") {
      const raf = requestAnimationFrame(() => {
        setLocalValues(initialValues);
        const target = findScrollContainer();
        setPortalTarget(target);
        updatePos(target);
        setPhase("before");
        requestAnimationFrame(() => setPhase("open"));
      });
      return () => cancelAnimationFrame(raf);
    }
    if (!open && (phase === "open" || phase === "before")) handleClose();
  }, [open]);

  // Outside click + escape
  useEffect(() => {
    if (phase === "closed") return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    const onDown = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        triggerRef?.current && !triggerRef.current.contains(e.target)
      ) handleClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [phase, handleClose, triggerRef]);

  // Recompute on resize only. Scroll handling is automatic because the
  // panel is `position: absolute` inside the same scroll container as
  // the trigger — they move together natively.
  useEffect(() => {
    if (phase === "closed") return;
    const handler = () => updatePos();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [phase, updatePos]);

  if (phase === "closed") return null;

  const isOpen = phase === "open";
  const hasT   = phase !== "before";
  const dur    = phase === "exiting" ? `${EXIT_MS}ms` : `${ENTER_MS}ms`;

  if (!portalTarget) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Filters"
      className="absolute z-30 bg-surface border border-border rounded-[0.625em] shadow-lg flex flex-col outline-none"
      style={{
        top: pos.top,
        left: pos.left,
        minWidth: "17em",
        maxWidth: "22em",
        maxHeight: "min(80vh, 32em)",
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? "translateY(0)" : "translateY(-0.375em)",
        transition: hasT
          ? `opacity ${dur} ease, transform ${dur} cubic-bezier(0.4,0,0.2,1)`
          : "none",
        pointerEvents: phase === "before" ? "none" : "auto",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[1em] pt-[0.875em] pb-[0.625em] border-b border-border-light shrink-0">
        <span className="text-[0.8125em] font-semibold text-text font-body">{tCommon("filters")}</span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className={cn(
              "flex items-center gap-[0.3em] text-[0.75em] font-medium text-text-muted",
              "hover:text-accent transition-colors duration-100",
              "focus-visible:outline-none focus-visible:underline",
            )}
          >
            <FiRotateCcw size="0.75em" strokeWidth={2} />
            Reset
          </button>
        )}
      </div>

      {/* Sections — scrollable */}
      <div className="flex-1 overflow-y-auto px-[1em] py-[0.875em] flex flex-col gap-[1.25em]">
        {sections.filter((s) => !s.hidden).map((section) => (
          <PanelSection
            key={section.key}
            section={section}
            value={localValues[section.key]}
            onToggleChip={(v) => toggleChip(section.key, v)}
            onRangeChange={(v) => {
              const updated = { ...localValues, [section.key]: v };
              setLocalValues(updated);
              applyLive(updated);
            }}
            onNumberChange={(v) => handleNumberChange(section.key, v)}
          />
        ))}
      </div>
    </div>,
    portalTarget,
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function PanelSection({ section, value, onToggleChip, onRangeChange, onNumberChange }) {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <p className="text-[0.6875em] font-semibold uppercase tracking-[0.07em] text-text-muted font-body">
        {section.label}
      </p>

      {section.type === "chips" && (
        <div className="flex flex-wrap gap-[0.375em]">
          {(section.options ?? []).map((opt) => {
            const on = Array.isArray(value) && value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={on}
                onClick={() => onToggleChip(opt.value)}
                className={cn(
                  "inline-flex items-center gap-[0.3em] h-[1.875em] px-[0.75em] rounded-full",
                  "text-[0.8125em] font-medium font-body border",
                  "transition-[background-color,border-color,color] duration-100",
                  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_rgba(59,110,204,0.3)]",
                  on
                    ? "bg-accent-light border-accent-border text-accent-text"
                    : "bg-bg border-border text-text-secondary hover:bg-surface-hover hover:text-text",
                )}
              >
                {on && <FiCheck size="0.7em" strokeWidth={2.5} />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {section.type === "range" && (
        <RangeSlider
          min={section.min ?? 0}
          max={section.max ?? 100}
          step={section.step ?? 1}
          unit={section.unit ?? ""}
          value={Array.isArray(value) ? value : [section.min ?? 0, section.max ?? 100]}
          onChange={onRangeChange}
        />
      )}

      {section.type === "numberInput" && (
        <input
          type="number"
          inputMode="numeric"
          min={section.minValue ?? 0}
          placeholder={section.placeholder ?? ""}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onNumberChange(e.target.value)}
          className={cn(
            "h-[2.25em] w-full px-[0.75em] rounded-[0.5em] border border-border bg-bg",
            "text-[0.875em] font-mono tabular-nums text-text",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-border)]",
            "transition-[border-color,box-shadow] duration-100",
          )}
        />
      )}
    </div>
  );
}

// ─── Range ───────────────────────────────────────────────────────────────────

function RangeSlider({ min, max, step, unit, value, onChange }) {
  const [low, high] = value;
  const fmt = (v) => (unit ? `${v.toLocaleString()} ${unit}` : v.toLocaleString());

  return (
    <div className="flex flex-col gap-[0.625em]">
      <div className="flex items-center justify-between text-[0.75em] font-mono font-medium text-text tabular-nums">
        <span>{fmt(low)}</span>
        <span className="text-text-muted">–</span>
        <span>{fmt(high)}</span>
      </div>
      <div className="flex flex-col gap-[0.375em]">
        <label className="text-[0.6875em] text-text-muted font-body">Min</label>
        <input type="range" min={min} max={high} step={step} value={low}
          onChange={(e) => onChange([Number(e.target.value), high])}
          className="w-full accent-accent cursor-pointer" />
      </div>
      <div className="flex flex-col gap-[0.375em]">
        <label className="text-[0.6875em] text-text-muted font-body">Max</label>
        <input type="range" min={low} max={max} step={step} value={high}
          onChange={(e) => onChange([low, Number(e.target.value)])}
          className="w-full accent-accent cursor-pointer" />
      </div>
    </div>
  );
}
