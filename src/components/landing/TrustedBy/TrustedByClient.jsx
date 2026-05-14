"use client";

import { useRef } from "react";
import { motion, useInView as useMotionInView } from "motion/react";
import InfiniteSlider from "./InfiniteSlider";
import PlaceholderLogo, { PLACEHOLDER_LOGOS } from "./logos";

/* TrustedBy — centered overline + headline, then an infinite horizontal
 * scroll of placeholder logos. The slider container has a mask-image so
 * its left/right edges fade into the section background. Pauses on hover
 * (durationOnHover slows it to a near-stop). */

export default function TrustedByClient({ overline, headline }) {
  const headerRef = useRef(null);
  const headerInView = useMotionInView(headerRef, { once: true, amount: 0.3 });

  return (
    <div className="flex flex-col gap-[2.5em]">
      {/* Centered header */}
      <motion.div
        ref={headerRef}
        className="flex flex-col items-center text-center max-w-[42em] mx-auto"
        initial={{ opacity: 0, y: 24 }}
        animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        <p className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-accent-text mb-[0.875em]">
          {overline}
        </p>
        <h2 className="font-heading font-bold text-[1.5em] sm:text-[1.875em] leading-[1.15] tracking-[-0.02em] text-text">
          {headline}
        </h2>
      </motion.div>

      {/* Logo strip with edge mask */}
      <div
        className="relative w-full"
        style={{
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        <InfiniteSlider
          duration={36}
          durationOnHover={120}
          gap={64}
          className="flex h-[3em] items-center"
        >
          {PLACEHOLDER_LOGOS.map(({ id, label }) => (
            <div key={id} className="flex items-center">
              <PlaceholderLogo label={label} />
            </div>
          ))}
        </InfiniteSlider>
      </div>
    </div>
  );
}
