"use client";

/**
 * IconButton — square icon-only chrome control. Used for toggle, bell,
 * avatar trigger, and the four sidebar bottom-dock shortcuts.
 *
 * Not the same as `AppButton` (which has labelled primary/secondary/accent/
 * ghost variants). This one is unlabelled-only, square hit-target, hover bg,
 * focus ring. If you find yourself reaching for an unlabelled square button
 * anywhere else in the app, use this — never roll your own.
 *
 * Props:
 *   children    : the icon (Lucide / react-icons element)
 *   size        : "sm" (2em) | "md" (2.25em, default) | "lg" (2.5em)
 *   active      : boolean — applies the accent-light pill background
 *   ariaLabel   : required (icon-only buttons must announce themselves)
 *   className   : extra Tailwind classes (e.g. positioning)
 *   ...rest     : forwarded to the <button> (onClick, type, disabled, etc.)
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: "w-[2em] h-[2em]",
  md: "w-[2.25em] h-[2.25em]",
  lg: "w-[2.5em] h-[2.5em]",
};

const IconButton = forwardRef(function IconButton(
  { children, size = "md", active = false, ariaLabel, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={ariaLabel}
      className={cn(
        "shrink-0 inline-flex items-center justify-center rounded-[0.5em]",
        "transition-[background-color,color,transform] duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
        "active:scale-95",
        SIZE[size],
        active
          ? "bg-accent-light text-accent-text"
          : "text-text-secondary hover:bg-bg-alt hover:text-text",
        rest.disabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

export default IconButton;
