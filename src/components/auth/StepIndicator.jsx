"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StepIndicator — icon row with no underline. Active step gets a pill of
 * accent-light behind its icon (single shared layoutId so it morphs
 * between positions on a spring). Past steps show a small accent check.
 *
 *   Active step  → icon text-accent, sits inside accent-light pill
 *   Past steps   → icon text-accent (lighter), small check mark below
 *   Future steps → icon text-text/50
 *
 *   Active label → text-text, font-semibold
 *   Other labels → text-text/50
 *
 * Props:
 *   steps         Array<{ icon: LucideIcon, label: string }>
 *   currentStep   number (0-indexed)
 *   pillId        string — must be unique per indicator instance on the page
 */
export default function StepIndicator({ steps, currentStep, pillId = "auth-step-pill" }) {
  return (
    <div className="w-full pt-[0.5em]">
      <div
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map(({ icon: Icon, label }, idx) => {
          const isActive = idx === currentStep;
          const isPast = idx < currentStep;

          return (
            <div key={label} className="flex flex-col items-center gap-[0.5em]">
              {/* Icon area — relative so the active pill can sit behind */}
              <div className="relative flex items-center justify-center w-[2.5em] h-[2.5em]">
                {isActive && (
                  <motion.div
                    layoutId={pillId}
                    transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
                    className="absolute inset-0 rounded-full bg-accent-light"
                  />
                )}
                <div
                  className={cn(
                    "relative flex items-center justify-center",
                    "transition-[color] duration-300 ease-out",
                    isActive && "text-accent",
                    isPast && "text-accent/70",
                    !isActive && !isPast && "text-text/50",
                  )}
                >
                  <Icon size="1.125em" strokeWidth={isActive ? 2 : 1.75} />
                </div>
              </div>

              {/* Label + past-step check */}
              <div className="flex items-center gap-[0.25em] min-h-[0.875em]">
                {isPast && (
                  <Check size="0.75em" strokeWidth={2.5} className="text-accent" />
                )}
                <span
                  className={cn(
                    "text-[0.6875em] tracking-[0.04em] uppercase font-body",
                    "transition-[color,opacity,font-weight] duration-300 ease-out",
                    isActive ? "text-text font-semibold" : "text-text/50 font-medium",
                  )}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
