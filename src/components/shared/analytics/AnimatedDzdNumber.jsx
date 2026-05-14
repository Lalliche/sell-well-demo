"use client";

/**
 * AnimatedDzdNumber — small wrapper around a Framer Motion
 * `useMotionValue` that animates a DZD amount from prev → next over
 * the shared band timing. Tween-based (not spring) so duration is
 * predictable and locks 1:1 with the wallet partition bar's slide.
 *
 * Reused by `CompanyWalletBand` for the hero balance + secondary stats
 * (Reserved · Total deposited). Other wallet surfaces can consume this
 * directly when they need the same number-tick feel without dragging
 * in the whole band.
 */

import { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { format as formatDZD } from "@/lib/format/currency";
import { ANIM_DURATION, ANIM_EASE } from "./wallet-band-helpers";

export default function AnimatedDzdNumber({ value, withSymbol = true, className }) {
  const motionValue = useMotionValue(0);
  const display = useTransform(motionValue, (v) =>
    formatDZD(Math.round(v), { withSymbol }),
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: ANIM_DURATION,
      ease: ANIM_EASE,
    });
    return () => controls.stop();
  }, [value, motionValue]);

  return <motion.span className={className}>{display}</motion.span>;
}
