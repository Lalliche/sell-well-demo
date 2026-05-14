"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useTransform } from "motion/react";
import EventPopover from "./EventPopover";

/* A single scroll-driven event row. Reveals as `progress` crosses `event.y`,
 * tracks hover state, and decides whether the popover should render above
 * or below based on available viewport space. */

const POPOVER_HEIGHT_PX = 360;

export default function EventRow({ event, progress, side }) {
  const rowRef = useRef(null);
  const [hovered, setHovered] = useState(false);
  const [placement, setPlacement] = useState("above");

  const opacity  = useTransform(progress, [event.y - 0.08, event.y - 0.02, 1], [0, 1, 1]);
  const x        = useTransform(progress, [event.y - 0.08, event.y], [side === "left" ? -8 : 8, 0]);
  const dotScale = useTransform(progress, [event.y - 0.05, event.y], [0, 1]);

  const isLeft = side === "left";
  const Icon = event.icon;

  function handleMouseEnter() {
    if (rowRef.current) {
      const rect = rowRef.current.getBoundingClientRect();
      setPlacement(rect.top < POPOVER_HEIGHT_PX ? "below" : "above");
    }
    setHovered(true);
  }

  return (
    <motion.div
      ref={rowRef}
      className="absolute left-0 right-0 flex items-start gap-[0.75em] cursor-default"
      style={{ top: `${event.y * 100}%`, opacity, x }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={{ scale: hovered ? 1.08 : 1 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`shrink-0 mt-[0.125em] w-[2em] h-[2em] rounded-[0.5em] flex items-center justify-center ${
          isLeft ? "bg-bg-alt text-text-muted" : "bg-(--accent-light) text-accent"
        }`}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <motion.div style={{ scale: dotScale }}>
          <Icon size={13} strokeWidth={1.75} />
        </motion.div>
      </motion.div>

      <div className="flex-1 min-w-0 py-[0.125em]">
        <div className="flex items-baseline gap-[0.5em] flex-wrap">
          <span className="font-body text-[0.875em] font-medium text-text leading-snug">
            {event.title}
          </span>
          {event.badge && (
            <span
              className={`font-mono text-[0.6875em] font-semibold tabular-nums px-[0.4375em] py-[0.0625em] rounded-[0.25em] whitespace-nowrap ${
                event.isPositive
                  ? "bg-trend-positive/10 text-trend-positive"
                  : isLeft
                    ? "bg-trend-negative/8 text-trend-negative"
                    : "bg-(--accent-light) text-accent"
              }`}
            >
              {event.badge}
            </span>
          )}
        </div>
        <div className="font-body text-[0.75em] text-text-muted mt-[0.1875em] leading-snug">
          {event.sub}
        </div>
      </div>

      <AnimatePresence>
        {hovered && <EventPopover DetailContent={event.DetailContent} placement={placement} />}
      </AnimatePresence>
    </motion.div>
  );
}
