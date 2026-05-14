"use client";

import { forwardRef } from "react";
import { motion } from "motion/react";
import { X, CheckCircle2 } from "lucide-react";
import { SNAPSHOTS } from "./snapshots";

const SPRING = { type: "spring", stiffness: 260, damping: 32, mass: 0.85 };

/* Desktop-only origin-aware FLIP panel. Starts at the clicked card's exact
 * bounding rect and animates to full row width / natural height. On exit
 * reverses back to the rect. The parent scene animates its own height in
 * tandem so the page below reflows smoothly. Mobile uses StageCard's inline
 * accordion instead — this component never renders below `lg`. */

const ExpandedPanel = forwardRef(function ExpandedPanel(
  { stage, panelId, titleId, originRect, onClose, closeLabel },
  ref,
) {
  const Snapshot = SNAPSHOTS[stage.id];
  const Icon = stage.icon;

  const tx = originRect ? originRect.left : 0;
  const ty = originRect ? originRect.top  : 0;
  const startW = originRect ? originRect.width : undefined;
  const endW   = originRect ? originRect.sceneWidth : undefined;

  return (
    <motion.div
      ref={ref}
      id={panelId}
      role="region"
      aria-labelledby={titleId}
      initial={
        originRect
          ? { opacity: 1, x: tx, y: ty, width: startW, borderRadius: 16 }
          : { opacity: 0, x: 0, y: 0, borderRadius: 16 }
      }
      animate={{
        opacity: 1, x: 0, y: 0, width: endW, borderRadius: 16,
        transition: SPRING,
      }}
      exit={
        originRect
          ? {
              opacity: 0, x: tx, y: ty, width: startW, borderRadius: 16,
              transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
            }
          : { opacity: 0, transition: { duration: 0.2 } }
      }
      onClick={onClose}
      role="button"
      tabIndex={0}
      aria-label={closeLabel}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClose(); } }}
      className="absolute left-0 top-0 bg-surface border border-border-light overflow-hidden cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]"
      style={{
        boxShadow: "0 30px 60px -20px rgba(26,26,26,0.18)",
        transformOrigin: "top left",
      }}
    >
      {/* Inner content fades in once geometry has settled */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6, transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] } }}
        transition={{ duration: 0.4, delay: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="relative p-[2em]"
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          aria-label={closeLabel}
          className="absolute top-[1em] right-[1em] w-[2em] h-[2em] rounded-full bg-bg-alt hover:bg-bg-alt/70 text-text-secondary hover:text-text flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border]"
        >
          <X size={14} strokeWidth={2} />
        </button>

        <div className="flex flex-col gap-[1.25em]">
          {/* Header */}
          <div className="flex items-center gap-[0.875em]">
            <div className="w-[2.75em] h-[2.75em] rounded-[0.625em] bg-(--accent-light) text-accent flex items-center justify-center shrink-0">
              <Icon size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-mono text-[0.6875em] font-semibold text-accent-text tracking-[0.08em]">
                STAGE {stage.badge}
              </p>
              <h3 id={titleId} className="font-heading text-[1.375em] font-bold tracking-[-0.02em] text-text">
                {stage.title}
              </h3>
            </div>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1.5em]">
            <div className="bg-bg border border-border-light rounded-[0.625em] p-[1em]">
              <Snapshot />
            </div>
            <div className="flex flex-col gap-[0.75em]">
              <p className="text-[0.9375em] leading-[1.55] text-text-secondary">{stage.blurb}</p>
              <ul className="flex flex-col gap-[0.5em]">
                {stage.bullets?.map((b) => (
                  <li key={b} className="flex items-start gap-[0.5em] text-[0.8125em] leading-normal text-text-secondary">
                    <CheckCircle2 size={14} strokeWidth={2} className="text-accent shrink-0 mt-[0.125em]" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
});

export default ExpandedPanel;
