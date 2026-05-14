/**
 * FormInputs — Single source of truth for all form inputs in the project.
 * Never create standalone <input> or <select> elements outside these components.
 *
 * All inputs are controlled components. onChange receives the VALUE directly, not the event.
 *
 * Exports:
 *   TextInput     — single-line text, email, password, url, tel
 *   TextArea      — multi-line text
 *   DateInput     — fully custom calendar picker (no native date input), en + fr locale-aware
 *   DropdownInput — single or multi-select dropdown; multi shows tag chips with delete
 *   FileInput     — file upload with drag-and-drop + animated states
 *
 * Shared props (all inputs):
 *   label         string — visible label above input
 *   value         controlled value
 *   onChange      (value) => void — receives value directly, NOT the event
 *   disabled      boolean
 *   required      boolean
 *   errorMessage  string — shown below input in error state
 *   helperText    string — shown below input in normal state
 *   className     string — extra classes on the wrapper
 *
 * States (all inputs):
 *   default · focus (accent border + accent-border ring) · error (red border + red bg tint) · disabled (muted) · filled
 *
 * Design system (design-system-final.md §Form Inputs):
 *   height 44px, padding 0 14px, radius 8px
 *   border: 1px border-border, bg: surface
 *   focus: border-accent, ring accent-border 3px
 *   error: border #B13B3B, bg #FBECEC
 */

"use client";
import { useState, useRef, useEffect, useCallback, useMemo, forwardRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  FiChevronDown, FiX, FiCheck, FiUpload,
  FiChevronLeft, FiChevronRight, FiCalendar,
  FiEye, FiEyeOff,
} from "react-icons/fi";
import { getPlatformSetting } from "@/lib/mock/admin";

/* ── Shared base styles ───────────────────────────────────────────────────── */
const baseInput = [
  "w-full bg-surface text-text font-body text-[1em] font-normal",
  "border border-border rounded-[0.5em]",
  "px-[0.875em]",
  "transition-[border-color,box-shadow,background-color] duration-150 ease-out",
  "placeholder:text-text-muted",
  "focus:outline-none focus:border-accent",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

const errorInput = "border-[#B13B3B] bg-[#FBECEC] focus:border-[#B13B3B]";
const focusRing  = "focus:shadow-[0_0_0_3px_rgba(59,110,204,0.15)]";

function Label({ label, required }) {
  if (!label) return null;
  return (
    <span className="block text-[0.875em] font-medium text-text mb-[0.375em]">
      {label}
      {required && <span className="text-[#B13B3B] ml-[0.25em]">*</span>}
    </span>
  );
}

function HelperText({ errorMessage, helperText }) {
  if (errorMessage) return <p className="mt-[0.375em] text-[0.75em] text-[#B13B3B]">{errorMessage}</p>;
  if (helperText)   return <p className="mt-[0.375em] text-[0.75em] text-text-muted">{helperText}</p>;
  return null;
}

/* ── TextInput ────────────────────────────────────────────────────────────── */
export function TextInput({
  label, value, onChange, disabled, required,
  errorMessage, helperText, className,
  type = "text", placeholder,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  return (
    <div className={cn("flex flex-col", className)}>
      <Label label={label} required={required} />
      <div className="relative">
        <input
          type={resolvedType}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            baseInput, focusRing, "h-[2.75em]",
            isPassword && "pr-[2.75em]",
            errorMessage && errorInput,
          )}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            disabled={disabled}
            className="absolute right-0 top-0 h-full px-[0.875em] flex items-center text-text-muted hover:text-text transition-colors duration-150 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword
              ? <FiEyeOff size="1em" strokeWidth={1.75} />
              : <FiEye    size="1em" strokeWidth={1.75} />
            }
          </button>
        )}
      </div>
      <HelperText errorMessage={errorMessage} helperText={helperText} />
    </div>
  );
}

/* ── TextArea ─────────────────────────────────────────────────────────────── */
export const TextArea = forwardRef(function TextArea({
  label, value, onChange, disabled, required,
  errorMessage, helperText, className,
  placeholder, rows = 4, maxLength,
}, ref) {
  return (
    <div className={cn("flex flex-col", className)}>
      <Label label={label} required={required} />
      <textarea
        ref={ref}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={cn(baseInput, focusRing, "py-[0.625em] resize-y min-h-[6em]", errorMessage && errorInput)}
      />
      {maxLength && (
        <p className="mt-[0.25em] text-[0.75em] text-text-muted text-right">
          {(value ?? "").length}/{maxLength}
        </p>
      )}
      <HelperText errorMessage={errorMessage} helperText={helperText} />
    </div>
  );
});

/* ── DateInput — fully custom calendar picker ─────────────────────────────── */
/**
 * DateInput additional props:
 *   minDate  string YYYY-MM-DD — earliest selectable date
 *   maxDate  string YYYY-MM-DD — latest selectable date
 *   placeholder string
 *
 * Uses next-intl's useLocale() to auto-detect en/fr and format accordingly.
 * No native <input type="date"> — fully custom calendar dropdown.
 */

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDayLabels(locale) {
  const base = new Date(2024, 0, 1); // Monday Jan 1 2024
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d).slice(0, 2);
  });
}

function getMonthLabel(locale, year, month) {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(new Date(year, month, 1));
}

function buildGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  // Monday-first: 0=Mon … 6=Sun
  let startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function DateInput({
  label, value, onChange, disabled, required,
  errorMessage, helperText, className,
  minDate, maxDate, placeholder = "Pick a date",
}) {
  const locale = useLocale();
  const selected = parseYMD(value);
  const today = new Date();

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear]   = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth()    ?? today.getMonth());
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) close(); };
    const onKey   = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const minD = parseYMD(minDate);
  const maxD = parseYMD(maxDate);

  const isDisabled = (date) => {
    if (!date) return true;
    if (minD && date < minD) return true;
    if (maxD && date > maxD) return true;
    return false;
  };

  const isToday = (date) => date && toYMD(date) === toYMD(today);
  const isSelected = (date) => date && value && toYMD(date) === value;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const select = (date) => {
    if (isDisabled(date)) return;
    onChange?.(toYMD(date));
    close();
  };

  const displayValue = selected
    ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(selected)
    : null;

  const grid = buildGrid(viewYear, viewMonth);
  const dayLabels = getDayLabels(locale);

  return (
    <div className={cn("flex flex-col relative", className)} ref={ref}>
      <Label label={label} required={required} />

      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          baseInput, focusRing,
          "h-[2.75em] flex items-center justify-between text-left cursor-pointer",
          !displayValue && "text-text-muted",
          errorMessage && errorInput,
          open && "border-accent shadow-[0_0_0_3px_rgba(59,110,204,0.15)]",
        )}
      >
        <span className="truncate">{displayValue ?? placeholder}</span>
        <div className="flex items-center gap-[0.375em] shrink-0 ml-[0.5em] text-text-muted">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange?.(""); }}
              className="hover:text-text"
              aria-label="Clear date"
            >
              <FiX size="0.875em" />
            </span>
          )}
          <FiCalendar size="0.875em" className={open ? "text-accent" : ""} />
        </div>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div
          className="absolute top-full left-0 mt-[0.375em] z-50 bg-surface border border-border rounded-[0.625em] shadow-lg p-[0.875em] w-[17em]"
          style={{ animation: "scale-in 0.12s ease-out" }}
        >
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-[0.75em]">
            <button
              type="button"
              onClick={prevMonth}
              className="w-[1.75em] h-[1.75em] flex items-center justify-center rounded-[0.375em] text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
            >
              <FiChevronLeft size="0.875em" />
            </button>
            <span className="text-[0.875em] font-semibold text-text font-body capitalize">
              {getMonthLabel(locale, viewYear, viewMonth)}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-[1.75em] h-[1.75em] flex items-center justify-center rounded-[0.375em] text-text-muted hover:bg-surface-hover hover:text-text transition-colors"
            >
              <FiChevronRight size="0.875em" />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-[0.25em]">
            {dayLabels.map((d) => (
              <div key={d} className="flex items-center justify-center h-[1.75em] text-[0.6875em] font-semibold text-text-muted uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-[0.125em]">
            {grid.map((date, i) => {
              if (!date) return <div key={i} />;
              const sel  = isSelected(date);
              const dis  = isDisabled(date);
              const tod  = isToday(date);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={dis}
                  onClick={() => select(date)}
                  className={cn(
                    "flex items-center justify-center h-[2em] w-full rounded-[0.375em]",
                    "text-[0.8125em] font-body transition-colors duration-100",
                    sel  && "bg-accent text-white font-semibold",
                    !sel && tod  && "border border-accent text-accent font-semibold",
                    !sel && !dis && !tod && "text-text hover:bg-surface-hover",
                    dis  && "text-text-muted opacity-40 cursor-not-allowed",
                  )}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <HelperText errorMessage={errorMessage} helperText={helperText} />
    </div>
  );
}

/* ── DropdownInput ────────────────────────────────────────────────────────── */
/**
 * DropdownInput additional props:
 *   options   Array<{ value: string, label: string }>
 *   multi     boolean — allow multiple selections (default: false)
 *             Multi mode shows selected items as removable tag chips below the trigger.
 *   placeholder string
 */
export function DropdownInput({
  label, value, onChange, disabled, required,
  errorMessage, helperText, className,
  options = [], multi = false, placeholder = "Select...",
}) {
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedValues = multi ? (Array.isArray(value) ? value : []) : value;
  const isSelected = (v) => multi ? selectedValues.includes(v) : selectedValues === v;

  const toggle = (v) => {
    if (multi) {
      const next = isSelected(v)
        ? selectedValues.filter((x) => x !== v)
        : [...selectedValues, v];
      onChange?.(next);
    } else {
      onChange?.(v);
      setOpen(false);
    }
  };

  const removeTag = (v) => onChange?.(selectedValues.filter((x) => x !== v));

  const hasValue = multi ? selectedValues.length > 0 : !!value;

  return (
    <div className={cn("flex flex-col gap-[0.375em]", className)} ref={ref}>
      <Label label={label} required={required} />

      {/* Trigger — tags live inside when multi */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          disabled={disabled}
          className={cn(
            "w-full bg-surface border border-border rounded-[0.5em]",
            "px-[0.875em] py-[0.5em] text-left cursor-pointer",
            "transition-[border-color,box-shadow] duration-150 ease-out",
            "focus:outline-none focus:border-accent",
            focusRing,
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !hasValue && "text-text-muted",
            errorMessage && errorInput,
            open && "border-accent shadow-[0_0_0_3px_rgba(59,110,204,0.15)]",
          )}
        >
          <div className="flex items-center justify-between gap-[0.5em] min-h-[1.75em]">
            {/* Left: tags or placeholder */}
            <div className="flex flex-wrap gap-[0.375em] flex-1 min-w-0">
              {multi && selectedValues.length > 0 ? (
                selectedValues.map((v) => {
                  const opt = options.find((o) => o.value === v);
                  return (
                    <span
                      key={v}
                      role="button"
                      tabIndex={0}
                      aria-label={`Remove ${opt?.label ?? v}`}
                      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); removeTag(v); }}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-[0.3em] px-[0.5em] py-[0.125em] rounded-[0.3125em] bg-bg-alt border border-border text-[0.8125em] font-medium text-text-secondary font-body cursor-pointer hover:bg-surface-hover hover:border-border transition-colors duration-100"
                    >
                      {opt?.label ?? v}
                      <FiX size="0.7em" className="text-text-muted" />
                    </span>
                  );
                })
              ) : (
                <span className={cn("text-[1em]", hasValue && !multi ? "text-text" : "text-text-muted")}>
                  {!multi
                    ? (options.find((o) => o.value === value)?.label ?? placeholder)
                    : placeholder}
                </span>
              )}
            </div>

            {/* Right: clear + chevron */}
            <div className="flex items-center gap-[0.25em] shrink-0">
              {!multi && hasValue && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onChange?.(null); }}
                  className="text-text-muted hover:text-text"
                  aria-label="Clear selection"
                >
                  <FiX size="0.875em" />
                </span>
              )}
              <FiChevronDown
                size="0.875em"
                className={cn("text-text-muted transition-transform duration-150", open && "rotate-180")}
              />
            </div>
          </div>
        </button>

        {/* Dropdown list */}
        {open && (
          <div
            className="absolute top-full left-0 right-0 mt-[0.25em] bg-surface border border-border rounded-[0.5em] shadow-md z-50 py-[0.25em] max-h-[14em] overflow-y-auto"
            style={{ animation: "scale-in 0.1s ease-out" }}
          >
            {options.length === 0 && (
              <p className="px-[0.875em] py-[0.625em] text-[0.875em] text-text-muted">{tCommon("noOptions")}</p>
            )}
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className={cn(
                  "w-full flex items-center justify-between px-[0.875em] py-[0.625em]",
                  "text-[0.875em] text-left hover:bg-surface-hover transition-colors duration-100",
                  isSelected(opt.value) && "text-accent font-medium bg-bg",
                )}
              >
                {opt.label}
                {isSelected(opt.value) && <FiCheck size="0.875em" className="shrink-0 text-accent" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <HelperText errorMessage={errorMessage} helperText={helperText} />
    </div>
  );
}

/* ── FileInput ────────────────────────────────────────────────────────────── */
/**
 * FileInput additional props:
 *   accept    string — e.g. ".pdf,.docx" or "image/*"
 *   maxSizeMb number — max file size in MB. When omitted, falls back to the
 *                      live PlatformSetting `max_upload_size_mb` (default 10).
 *                      Call sites that need a tighter per-input cap (e.g. 5MB
 *                      for image thumbnails) keep passing an explicit value;
 *                      those should never exceed the platform max but the
 *                      mock layer doesn't enforce the relationship today.
 *   variant   "file" | "image"  — controls filled-state rendering.
 *               "file":  icon + name + size (default).
 *               "image": square live thumbnail preview using object URL.
 *   multi     boolean — accept multiple files. value becomes File[].
 *
 * Animations:
 *   idle     → subtle dashed border
 *   dragover → accent border + scale-up icon + blue tint bg (instant)
 *   filled   → shows file name + size, OR thumbnail (image variant), OR list (multi)
 *   error    → red border
 *
 * Object URL lifecycle: image variant builds object URLs from File objects
 * via useMemo and revokes them on unmount / file change.
 */
export function FileInput({
  label, value, onChange, disabled, required,
  errorMessage, helperText, className,
  accept, maxSizeMb,
  variant = "file",
  multi = false,
}) {
  const tCommon = useTranslations("Common");
  // Live read so admin edits in /admin/settings instantly tighten/loosen
  // the platform-wide max. Caller can override per-input by passing
  // explicit `maxSizeMb` (e.g. tighter 5MB cap for image thumbnails).
  const effectiveSizeMb = typeof maxSizeMb === "number"
    ? maxSizeMb
    : getPlatformSetting("max_upload_size_mb", 10);

  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState(null);

  /* ── Normalize value to an array internally; expose original shape on change ── */
  const filesArray = useMemo(
    () => multi
      ? (Array.isArray(value) ? value : [])
      : (value ? [value] : []),
    [multi, value],
  );

  const emit = (nextArr) => {
    setSizeError(null);
    if (multi) {
      onChange?.(nextArr);
    } else {
      onChange?.(nextArr[0] ?? null);
    }
  };

  const accept_ = accept;

  const validateAndAdd = (incoming) => {
    if (!incoming || incoming.length === 0) return;
    const accepted = [];
    for (const f of incoming) {
      if (f.size > effectiveSizeMb * 1024 * 1024) {
        setSizeError(tCommon("fileSizeExceeds", { name: f.name, size: effectiveSizeMb }));
        return;
      }
      accepted.push(f);
    }
    if (multi) {
      emit([...filesArray, ...accepted]);
    } else {
      emit(accepted.slice(0, 1));
    }
  };

  const removeAt = (idx) => {
    const nextArr = filesArray.filter((_, i) => i !== idx);
    emit(nextArr);
  };

  /* ── Object URLs for image previews ── */
  const objectUrls = useMemo(() => {
    if (variant !== "image") return [];
    return filesArray.map((f) => (f instanceof File ? URL.createObjectURL(f) : null));
    // intentional dep: revoke on next compute via the cleanup below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filesArray, variant]);

  useEffect(() => {
    return () => {
      objectUrls.forEach((url) => { if (url) URL.revokeObjectURL(url); });
    };
  }, [objectUrls]);

  const displayError = sizeError || errorMessage;
  const hasFiles = filesArray.length > 0;
  const showAdder = !hasFiles || multi;

  return (
    <div className={cn("flex flex-col", className)}>
      <Label label={label} required={required} />

      <div className="flex flex-col gap-[0.5em]">
        {/* Filled list (single or multi) */}
        {hasFiles && (
          <div className={cn(
            variant === "image" && multi
              ? "grid grid-cols-3 gap-[0.5em]"
              : "flex flex-col gap-[0.5em]"
          )}>
            {filesArray.map((file, idx) => (
              <FilePreview
                key={`${file.name}-${idx}`}
                file={file}
                objectUrl={objectUrls[idx]}
                variant={variant}
                onRemove={() => removeAt(idx)}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {/* Adder (drop zone) */}
        {showAdder && (
          <div
            onClick={() => !disabled && inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); validateAndAdd(Array.from(e.dataTransfer.files)); }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-[0.625em]",
              "border border-dashed rounded-[0.5em] p-[1.5em]",
              "transition-[border-color,background-color,transform] duration-200 ease-out",
              "cursor-pointer hover:border-accent hover:bg-[rgba(59,110,204,0.02)]",
              dragOver && "border-accent bg-[rgba(59,110,204,0.05)] scale-[1.01]",
              !dragOver && "border-border bg-surface",
              displayError && "border-[#B13B3B]",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <div className="flex flex-col items-center gap-[0.5em] text-center">
              <div
                className={cn(
                  "flex items-center justify-center w-[2.5em] h-[2.5em] rounded-full",
                  "transition-all duration-200",
                  dragOver ? "bg-accent text-white scale-110" : "bg-bg-alt text-text-muted",
                )}
              >
                <FiUpload size="1.125em" />
              </div>
              <div>
                <p className="text-[0.875em] text-text-secondary font-body">
                  <span className="text-accent font-semibold">
                    {hasFiles ? tCommon("addAnother") : tCommon("clickToUpload")}
                  </span>
                  {!hasFiles && ` ${tCommon("orDragAndDrop")}`}
                </p>
                {accept_ && (
                  <p className="text-[0.75em] text-text-muted font-body mt-[0.125em]">{accept_}</p>
                )}
                <p className="text-[0.75em] text-text-muted font-body">{tCommon("maxFileSize", { size: effectiveSizeMb })}</p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={accept_}
              multiple={multi}
              disabled={disabled}
              onChange={(e) => validateAndAdd(Array.from(e.target.files ?? []))}
              className="hidden"
            />
          </div>
        )}
      </div>

      <HelperText errorMessage={displayError} helperText={helperText} />
    </div>
  );
}

/* ── FilePreview — internal — single file row/tile ── */
function FilePreview({ file, objectUrl, variant, onRemove, disabled }) {
  if (variant === "image" && objectUrl) {
    return (
      <div className="relative group rounded-[0.5em] overflow-hidden border border-border bg-surface aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={objectUrl}
          alt={file.name}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          className="absolute top-[0.375em] right-[0.375em] flex items-center justify-center w-[1.75em] h-[1.75em] rounded-full bg-text/85 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 backdrop-blur-sm"
        >
          <FiX size="0.875em" />
        </button>
      </div>
    );
  }

  // file row (default)
  return (
    <div className="flex items-center gap-[0.875em] w-full border border-border rounded-[0.5em] bg-surface p-[0.75em]">
      <div className="flex items-center justify-center w-[2.5em] h-[2.5em] rounded-[0.5em] bg-status-active-bg shrink-0">
        <FiCheck size="1.125em" className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.875em] font-semibold text-text font-body truncate">{file.name}</p>
        <p className="text-[0.75em] text-text-muted font-body">
          {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        aria-label={`Remove ${file.name}`}
        className="shrink-0 flex items-center justify-center w-[1.75em] h-[1.75em] rounded-[0.375em] text-text-muted hover:text-[#B13B3B] hover:bg-status-rejected-bg transition-colors duration-150"
      >
        <FiX size="0.875em" />
      </button>
    </div>
  );
}
