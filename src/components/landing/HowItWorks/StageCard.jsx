"use client";

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, X, CheckCircle2 } from "lucide-react";
import { SNAPSHOTS } from "./snapshots";

const ARROW_VARIANTS = { rest: { x: 0 }, hover: { x: 4 } };
const ICON_VARIANTS  = { rest: { scale: 1, rotate: 0 }, hover: { scale: 1.1, rotate: 4 } };

/* Collapsed clickable card. On mobile (`isInlineExpanded`) the same card
 * also renders the bullet list inline + swaps the icon to an X + relabels
 * the CTA chip to "Close". On desktop the card always stays collapsed and
 * the ExpandedPanel takes over via FLIP. */

const StageCard = ({
  stage, panelId, titleId, ctaLabel, closeLabel,
  onOpen, onClose, registerRef,
  isActive, isInlineExpanded,
}) => {
  const Snapshot = SNAPSHOTS[stage.id];
  const Icon = stage.icon;

  return (
    <motion.button
      ref={registerRef}
      type="button"
      onClick={isInlineExpanded ? onClose : onOpen}
      aria-expanded={isActive}
      aria-controls={panelId}
      initial="rest"
      animate="rest"
      whileHover={isInlineExpanded ? undefined : "hover"}
      whileFocus={isInlineExpanded ? undefined : "hover"}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={
        "group relative w-full text-left p-[1.5em] flex flex-col gap-[1em] cursor-pointer rounded-[1em] bg-surface border transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--accent-border] overflow-hidden " +
        (isInlineExpanded
          ? "border-accent/30"
          : "border-border-light hover:border-accent/20 focus-visible:border-accent/30")
      }
    >
      {/* Top: badge + icon (or X glyph when inline-expanded) */}
      <div className="relative flex items-center justify-between">
        <span className="font-mono text-[0.75em] font-semibold text-accent-text tracking-[0.08em]">
          {stage.badge}
        </span>

        {isInlineExpanded ? (
          <span
            aria-label={closeLabel}
            className="w-[2.25em] h-[2.25em] rounded-full bg-bg-alt text-text-secondary flex items-center justify-center"
          >
            <X size={14} strokeWidth={2} />
          </span>
        ) : (
          <motion.div
            variants={ICON_VARIANTS}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-[2.25em] h-[2.25em] rounded-[0.5em] bg-(--accent-light) text-accent flex items-center justify-center"
          >
            <Icon size={16} strokeWidth={1.75} />
          </motion.div>
        )}
      </div>

      {/* Title + blurb */}
      <div className="relative flex flex-col gap-[0.375em]">
        <h3
          id={titleId}
          className={
            "font-heading text-[1em] font-bold tracking-[-0.01em] leading-tight transition-colors duration-200 " +
            (isInlineExpanded
              ? "text-accent-text"
              : "text-text group-hover:text-accent-text group-focus-visible:text-accent-text")
          }
        >
          {stage.title}
        </h3>
        <p className="font-body text-[0.8125em] leading-normal text-text-secondary">
          {stage.blurb}
        </p>
      </div>

      {/* Snapshot artifact */}
      <div className="relative flex-1 bg-bg/60 border border-border-light rounded-[0.625em] p-[0.75em] mt-auto">
        <Snapshot />
      </div>

      {/* Bullets — inline-expanded only (mobile accordion) */}
      <AnimatePresence initial={false}>
        {isInlineExpanded && (
          <motion.div
            key="bullets"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="relative overflow-hidden"
          >
            <ul className="flex flex-col gap-[0.5em] pt-[0.25em]">
              {stage.bullets?.map((b) => (
                <li key={b} className="flex items-start gap-[0.5em] text-[0.8125em] leading-normal text-text-secondary">
                  <CheckCircle2 size={14} strokeWidth={2} className="text-accent shrink-0 mt-[0.125em]" />
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA chip — relabels to closeLabel and drops the arrow when expanded */}
      <div className="relative flex items-center">
        <span
          className={
            "inline-flex items-center gap-[0.375em] font-body text-[0.75em] font-medium rounded-full px-[0.75em] py-[0.3125em] border transition-colors duration-200 " +
            (isInlineExpanded
              ? "bg-(--accent-light) text-accent-text border-accent/30"
              : "bg-(--accent-light) text-accent-text border-accent/15 group-hover:border-accent/30 group-focus-visible:border-accent/30")
          }
        >
          {isInlineExpanded ? closeLabel : ctaLabel}
          {!isInlineExpanded && (
            <motion.span
              aria-hidden="true"
              variants={ARROW_VARIANTS}
              className="inline-flex"
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <ArrowRight size={11} strokeWidth={2} />
            </motion.span>
          )}
        </span>
      </div>
    </motion.button>
  );
};

export default StageCard;
