"use client";

/**
 * Toggle — pill-shaped on/off switch.
 *
 * Design system:
 *   Off : bg-border track, white thumb
 *   On  : bg-accent track, white thumb
 *   Disabled: 50% opacity, cursor-not-allowed
 *
 * Props:
 *   checked   boolean
 *   onChange  (checked: boolean) => void
 *   disabled  boolean
 *   label     string — visible label to the right of the pill (optional)
 *   id        string — for <label htmlFor> pairing (optional)
 *   size      "sm" | "md" (default)
 *
 * Fully keyboard-accessible: role="switch", aria-checked, Space/Enter
 * toggles, focus-visible ring in accent-border.
 */

import { cn } from "@/lib/utils";

const SIZE = {
  sm: {
    track:  "w-[2em] h-[1.125em]",
    thumb:  "w-[0.875em] h-[0.875em]",
    translate: "translate-x-[0.875em]",
    label: "text-[0.8125em]",
  },
  md: {
    track:  "w-[2.5em] h-[1.375em]",
    thumb:  "w-[1.0625em] h-[1.0625em]",
    translate: "translate-x-[1.125em]",
    label: "text-[0.875em]",
  },
};

export default function Toggle({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
  size = "md",
  className,
}) {
  const s = SIZE[size] ?? SIZE.md;

  const handleClick = () => {
    if (!disabled) onChange?.(!checked);
  };

  const handleKey = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (!disabled) onChange?.(!checked);
    }
  };

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center gap-[0.625em] select-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKey}
        className={cn(
          "relative inline-flex shrink-0 items-center rounded-full p-[0.125em]",
          "transition-[background-color] duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border] focus-visible:ring-offset-1",
          s.track,
          checked ? "bg-accent" : "bg-border",
          disabled && "pointer-events-none",
        )}
      >
        <span
          className={cn(
            "inline-block rounded-full bg-surface shadow-xs",
            "transition-transform duration-200 ease-out",
            s.thumb,
            checked ? s.translate : "translate-x-0",
          )}
        />
      </button>

      {label && (
        <span className={cn("font-body font-medium text-text", s.label)}>
          {label}
        </span>
      )}
    </label>
  );
}
