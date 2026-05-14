"use client";

import { motion, useMotionValue, useMotionValueEvent } from "motion/react";

/* Maps a 0..1 scroll-progress value onto a fictional 9:00 AM → 6:00 PM
 * workday clock string. Used inside the moving "clock pill" on the center
 * rail of the Solution section. */
function formatProgressTime(v) {
  const totalMinutes = Math.max(0, Math.min(540, v * 540));
  const hours = Math.floor(totalMinutes / 60) + 9;
  const minutes = Math.floor(totalMinutes % 60);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayH = hours > 12 ? hours - 12 : hours;
  return `${displayH}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

export default function ClockTime({ progress }) {
  const time = useMotionValue("9:00 AM");
  useMotionValueEvent(progress, "change", (v) => {
    time.set(formatProgressTime(v));
  });
  return <motion.span>{time}</motion.span>;
}
