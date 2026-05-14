"use client";

import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MorphAuthButton — Linear-style "Continue with email" button that morphs
 * into an inline form via shared-layoutId FLIP.
 *
 * Single motion.div with `layout` handles the container shape change.
 * The inner content (collapsed button vs expanded form) cross-fades via
 * plain CSS opacity — no nested AnimatePresence, no competing animations.
 *
 * Props:
 *   id            unique string — used as layoutId so multiple morph
 *                 buttons can coexist in the same view.
 *   expanded      boolean — controlled state.
 *   onExpand      () => void — invoked when collapsed-row is clicked.
 *   onCollapse    () => void — invoked when back button is pressed.
 *   icon          ReactNode — icon shown in the collapsed state (left).
 *   label         string — label shown in the collapsed state.
 *   title         string — heading shown in the expanded state.
 *   children      form contents shown in the expanded state.
 *   showBack      boolean — whether to render the back arrow in expanded
 *                 state (default true).
 */
export default function MorphAuthButton({
  id,
  expanded,
  onExpand,
  onCollapse,
  icon,
  label,
  title,
  children,
  showBack = true,
}) {
  return (
    <motion.div
      layout
      layoutId={id}
      transition={{ type: "spring", stiffness: 280, damping: 34, mass: 1.1 }}
      style={{ willChange: "transform" }}
      className={cn(
        "w-full bg-surface border border-border rounded-[0.625em]",
        "overflow-hidden",
      )}
    >
      {!expanded ? (
        <motion.button
          layout="position"
          type="button"
          onClick={onExpand}
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={cn(
            "w-full h-[2.875em] flex items-center justify-center gap-[0.5em]",
            "text-[0.9375em] font-medium text-text font-body",
            "transition-colors duration-150 ease-out",
            "hover:bg-surface-hover",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1",
            "active:bg-surface-hover",
          )}
        >
          {icon && <span className="flex items-center shrink-0">{icon}</span>}
          <span>{label}</span>
        </motion.button>
      ) : (
        <motion.div
          layout="position"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.32, ease: "easeOut", delay: 0.16 }}
          className="p-[1em] flex flex-col gap-[0.875em]"
        >
          {(title || showBack) && (
            <div className="flex items-center gap-[0.5em] -mb-[0.25em]">
              {showBack && (
                <button
                  type="button"
                  onClick={onCollapse}
                  aria-label="Back"
                  className={cn(
                    "shrink-0 flex items-center justify-center w-[1.75em] h-[1.75em] rounded-[0.375em]",
                    "text-text-muted hover:text-text hover:bg-surface-hover",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    "transition-colors duration-150",
                  )}
                >
                  <ArrowLeft size="1em" strokeWidth={1.75} />
                </button>
              )}
              {title && (
                <span className="text-[0.875em] font-semibold text-text font-body">
                  {title}
                </span>
              )}
            </div>
          )}
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
