"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* Single accordion row. Smooth height animation on body, +/× rotation on
 * the toggle icon. Closed = bg-surface, open = bg-bg-alt for a quiet
 * "this one is active" feel without breaking the no-appearing-borders rule. */

export default function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      animate={isOpen ? "open" : "closed"}
      className={cn(
        "rounded-[0.75em] border border-border-light transition-colors duration-300",
        isOpen ? "bg-bg-alt" : "bg-surface",
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-[1em] p-[1.25em] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border] rounded-[0.75em]"
      >
        <span
          className={cn(
            "font-body text-[1em] font-medium leading-[1.4] transition-colors duration-200",
            isOpen ? "text-text" : "text-text-secondary",
          )}
        >
          {question}
        </span>
        <motion.span
          variants={{
            open:   { rotate: 45 },
            closed: { rotate: 0 },
          }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="shrink-0"
        >
          <Plus
            size={18}
            strokeWidth={2}
            className={cn(
              "transition-colors duration-200",
              isOpen ? "text-accent" : "text-text-muted",
            )}
          />
        </motion.span>
      </button>
      <motion.div
        initial={false}
        animate={{
          height: isOpen ? "auto" : 0,
          marginBottom: isOpen ? "1em" : 0,
        }}
        transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
        className="overflow-hidden px-[1.25em]"
      >
        <p className="font-body text-[0.9375em] leading-[1.6] text-text-secondary">
          {answer}
        </p>
      </motion.div>
    </motion.div>
  );
}
