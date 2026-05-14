"use client";

import { motion } from "motion/react";

/* Hover popover. Auto-flips above ↔ below the event row based on the
 * `placement` prop (set by EventRow from a viewport-space measurement). */

export default function EventPopover({ DetailContent, placement }) {
  const isAbove = placement === "above";
  return (
    <motion.div
      initial={{ opacity: 0, y: isAbove ? 8 : -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: isAbove ? 8 : -8, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute z-30 left-1/2 -translate-x-1/2 w-[19em] max-w-[calc(100vw-2em)] bg-surface border border-border-light rounded-[0.625em] p-[1em] pointer-events-none ${
        isAbove ? "bottom-[calc(100%+0.75em)]" : "top-[calc(100%+0.75em)]"
      }`}
      style={{
        boxShadow:
          "0 1px 2px rgba(15,23,42,0.06), 0 12px 32px -8px rgba(15,23,42,0.14), 0 24px 48px -16px rgba(15,23,42,0.12)",
      }}
    >
      <DetailContent />
      <span
        className={`absolute left-1/2 -translate-x-1/2 w-[0.625em] h-[0.625em] rotate-45 bg-surface ${
          isAbove
            ? "bottom-[-0.3125em] border-r border-b border-border-light"
            : "top-[-0.3125em] border-l border-t border-border-light"
        }`}
      />
    </motion.div>
  );
}
