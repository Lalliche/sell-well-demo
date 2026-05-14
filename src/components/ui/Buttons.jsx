/**
 * AppButton — Single source of truth for all buttons in the project.
 * Never create a raw <button> element outside this component.
 *
 * Props:
 *   variant  "primary" | "accent" | "secondary" | "ghost"  (default: "primary")
 *   size     "sm" | "md" | "lg"                             (default: "md")
 *   disabled  boolean                                        (default: false)
 *   isLoading boolean — shows spinner, disables interaction  (default: false)
 *   onClick   function
 *   type      "button" | "submit" | "reset"                 (default: "button")
 *   className extra Tailwind classes (merged via cn)
 *   children  button label / content
 *
 * States:
 *   default · hover (lift + darken) · focus-visible (accent ring) · active · disabled (50% opacity) · loading (spinner)
 *
 * Design system mapping (design-system-final.md §Buttons):
 *   primary   → bg-cta (#1A1A1A), white text, hover bg-cta-hover
 *   accent    → bg-accent (#3B6ECC), white text, hover bg-accent-hover
 *   secondary → transparent, border-border, text-text, hover bg-surface-hover
 *   ghost     → transparent, no border, text-text-secondary
 */

import { cn } from "@/lib/utils";

const VARIANTS = {
  primary:   "bg-cta text-cta-text hover:bg-cta-hover border border-transparent",
  accent:    "bg-accent text-white hover:bg-accent-hover border border-transparent",
  secondary: "bg-transparent text-text border border-border hover:bg-surface-hover",
  ghost:     "bg-transparent text-text-secondary border border-transparent hover:text-text",
};

const SIZES = {
  sm: "h-[2em] px-[1em] text-[0.8125em] gap-[0.375em]",
  md: "h-[2.5em] px-[1.25em] text-[0.875em] gap-[0.5em]",
  lg: "h-[3em] px-[1.5em] text-[0.9375em] gap-[0.5em]",
};

export default function AppButton({
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  onClick,
  type = "button",
  className,
  children,
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-[0.5em] font-body whitespace-nowrap",
        "transition-[transform,background-color,opacity,box-shadow] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "focus-visible:ring-accent",
        "active:scale-[0.98]",
        "hover:-translate-y-[1px] hover:shadow-xs",
        VARIANTS[variant],
        SIZES[size],
        isDisabled && "opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none",
        className
      )}
    >
      {isLoading && (
        <svg
          className="animate-spin shrink-0"
          style={{ width: "1em", height: "1em" }}
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
