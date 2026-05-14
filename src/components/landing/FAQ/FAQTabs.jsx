"use client";

import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

/* Tab strip. Selected tab fills with --accent via a slide-up `motion.span`
 * (y: 100% → 0%); unselected tabs are bordered chips. Switches the active
 * category in the parent. */

export default function FAQTabs({ categories, selected, onSelect }) {
  return (
    <div className="relative z-10 flex flex-wrap items-center justify-center gap-[0.625em]">
      {categories.map(({ key, label }) => {
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isSelected}
            className={cn(
              "relative overflow-hidden whitespace-nowrap rounded-[0.5em] border px-[0.875em] py-[0.5em] font-body text-[0.8125em] font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]",
              isSelected
                ? "border-accent text-cta-text"
                : "border-border-light bg-transparent text-text-muted hover:text-text",
            )}
          >
            <span className="relative z-10">{label}</span>
            <AnimatePresence>
              {isSelected && (
                <motion.span
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
                  className="absolute inset-0 z-0 bg-accent"
                  aria-hidden="true"
                />
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
