"use client";

import { motion, AnimatePresence } from "motion/react";

/**
 * StepBody — Pattern 1 transition wrapper from the multi-step research.
 *
 * Wraps the body of one sub-step. Uses AnimatePresence with mode="popLayout"
 * so the parent's `layout` prop springs the card height as content swaps.
 * Old fields exit fade + Y -8px; new fields enter fade + Y +8px.
 * Symmetric (back uses the same animation).
 *
 * Props:
 *   stepKey    unique key per step (drives the swap)
 *   children   step content
 */
export default function StepBody({ stepKey, children }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={stepKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-[1em]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
