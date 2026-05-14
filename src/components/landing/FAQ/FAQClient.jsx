"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView as useMotionInView } from "motion/react";
import FAQTabs from "./FAQTabs";
import FAQItem from "./FAQItem";

/* FAQ orchestrator. Centered overline + headline + subtitle, four tabs
 * (Tech Companies / Sales Partners / Partner Links / Pricing & Fees),
 * AnimatePresence-swapped question list per tab. */

export default function FAQClient({
  overline, headline, subtitle,
  tabs, faqByCategory,
}) {
  const headerRef = useRef(null);
  const headerInView = useMotionInView(headerRef, { once: true, amount: 0.3 });

  const [selected, setSelected] = useState(tabs[0]?.key ?? "");
  const activeQuestions = faqByCategory[selected] ?? [];

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
        <h2 className="font-heading font-bold text-[2em] sm:text-[2.5em] leading-[1.08] tracking-[-0.03em] text-text mb-[0.5em]">
          {headline}
        </h2>
        <p className="font-body text-[1em] leading-[1.6] text-text-secondary">
          {subtitle}
        </p>
      </motion.div>

      {/* Tabs */}
      <FAQTabs
        categories={tabs}
        selected={selected}
        onSelect={setSelected}
      />

      {/* Question list */}
      <div className="mx-auto w-full max-w-[48em]">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col gap-[0.75em]"
          >
            {activeQuestions.map((qa, i) => (
              <FAQItem key={`${selected}-${i}`} question={qa.q} answer={qa.a} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
