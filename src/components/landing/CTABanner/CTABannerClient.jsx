"use client";

import { useRef } from "react";
import { motion, useInView as useMotionInView } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/* CTABanner — final dual-audience closer before the footer.
 *
 * Flat on the cream section bg (no card, no shadow) so the eye flows
 * cleanly from FAQ → CTA → Footer without a third "container" interrupt.
 * Two parallel CTAs: primary near-black → company signup; secondary outline
 * → partner signup. Mirrors the TwoPaths section's role-prefixed signup URLs. */

const ARROW_VARIANTS = { rest: { x: 0 }, hover: { x: 4 } };

export default function CTABannerClient({
  overline, headline, subcopy,
  ctaCompany, ctaPartner, reassurance,
}) {
  const ref = useRef(null);
  const inView = useMotionInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center text-center max-w-[42em] mx-auto gap-[1em]"
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      <p className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-accent-text">
        {overline}
      </p>

      <h2 className="font-heading font-bold text-[2em] sm:text-[2.5em] leading-[1.08] tracking-[-0.03em] text-text">
        {headline}
      </h2>

      <p className="font-body text-[1.0625em] leading-[1.6] text-text-secondary max-w-[34em]">
        {subcopy}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-[0.75em] mt-[1em]">
        <Link
          href="/signup?role=company"
          className="group inline-flex items-center gap-[0.5em] rounded-[0.5em] bg-cta hover:bg-cta-hover text-cta-text font-body text-[0.9375em] font-semibold px-[1.5em] py-[0.8125em] transition-colors duration-200"
        >
          {ctaCompany}
          <motion.span aria-hidden="true" variants={ARROW_VARIANTS} initial="rest" animate="rest" whileHover="hover" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="inline-flex">
            <ArrowRight size={15} strokeWidth={2} />
          </motion.span>
        </Link>

        <Link
          href="/signup?role=partner"
          className="group inline-flex items-center gap-[0.5em] rounded-[0.5em] border border-border text-text hover:bg-surface font-body text-[0.9375em] font-semibold px-[1.5em] py-[0.75em] transition-colors duration-200"
        >
          {ctaPartner}
          <motion.span aria-hidden="true" variants={ARROW_VARIANTS} initial="rest" animate="rest" whileHover="hover" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="inline-flex">
            <ArrowRight size={15} strokeWidth={2} />
          </motion.span>
        </Link>
      </div>

      <p className="font-body text-[0.8125em] text-text-muted mt-[0.5em]">
        {reassurance}
      </p>
    </motion.div>
  );
}
