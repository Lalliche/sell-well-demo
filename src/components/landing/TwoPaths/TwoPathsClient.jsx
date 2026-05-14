"use client";

import { useRef } from "react";
import { motion, useInView as useMotionInView } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";

/* ──────────────────────────────────────────────────────────────────────────
 * TwoPaths — "Two sides, one platform"
 *
 * Two equal cards side-by-side. Left = Tech Companies (faint accent-tinted
 * surface, primary near-black CTA). Right = Sales Partners (bg-alt warm
 * cream, secondary outline CTA). Symmetric layout, no "featured" variant —
 * both audiences are equally important.
 *
 * Hover affordance per card-hover memory rule for interactive cards:
 *  - y-lift -4px, shadow grows
 *  - heading shifts text → text-accent-text
 *  - CTA arrow slides 4px right
 *  - no appearing borders
 * ──────────────────────────────────────────────────────────────────────── */

const ARROW_VARIANTS = { rest: { x: 0 }, hover: { x: 4 } };

const CARD_VARIANTS = {
  rest:  {
    y: 0,
    boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -8px rgba(15,23,42,0.06)",
  },
  hover: {
    y: -4,
    boxShadow: "0 4px 12px rgba(15,23,42,0.06), 0 24px 48px -16px rgba(15,23,42,0.12)",
  },
};

function PathCard({
  eyebrow, heading, body, bullets,
  ctaLabel, ctaHref, ctaPrimary,
  surfaceClass, borderClass,
}) {
  return (
    <motion.div
      variants={CARD_VARIANTS}
      initial="rest"
      whileHover="hover"
      whileFocus="hover"
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative flex flex-col gap-[1.25em] p-[2em] sm:p-[2.5em] rounded-[1em] border ${borderClass} ${surfaceClass}`}
    >
      <p className="font-body text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-text-muted">
        {eyebrow}
      </p>

      <h3 className="font-heading text-[1.5em] sm:text-[1.75em] font-bold tracking-[-0.02em] leading-[1.15] text-text transition-colors duration-300 group-hover:text-accent-text group-focus-visible:text-accent-text">
        {heading}
      </h3>

      <p className="font-body text-[1em] leading-[1.6] text-text-secondary max-w-[34em]">
        {body}
      </p>

      <ul className="flex flex-col gap-[0.6875em] mt-[0.25em]">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-[0.625em] font-body text-[0.9375em] leading-normal text-text-secondary">
            <span className="shrink-0 mt-[0.1875em] w-[1.125em] h-[1.125em] rounded-full bg-(--accent-light) text-accent flex items-center justify-center">
              <Check size={11} strokeWidth={2.5} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-[1em]">
        <Link
          href={ctaHref}
          className={`inline-flex items-center gap-[0.5em] rounded-[0.5em] font-body text-[0.875em] font-semibold transition-colors duration-200 ${
            ctaPrimary
              ? "bg-cta hover:bg-cta-hover text-cta-text px-[1.25em] py-[0.6875em]"
              : "border border-border text-text hover:bg-surface-hover px-[1.25em] py-[0.625em]"
          }`}
        >
          {ctaLabel}
          <motion.span aria-hidden="true" variants={ARROW_VARIANTS} className="inline-flex" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            <ArrowRight size={14} strokeWidth={2} />
          </motion.span>
        </Link>
      </div>
    </motion.div>
  );
}

export default function TwoPathsClient({
  overline, headline,
  companyEyebrow, companyHeading, companyBody,
  companyB1, companyB2, companyB3, companyCta,
  partnerEyebrow, partnerHeading, partnerBody,
  partnerB1, partnerB2, partnerB3, partnerCta,
}) {
  const headerRef = useRef(null);
  const cardsRef  = useRef(null);

  const headerInView = useMotionInView(headerRef, { once: true, amount: 0.3 });
  const cardsInView  = useMotionInView(cardsRef,  { once: true, amount: 0.1, margin: "0px 0px -10% 0px" });

  return (
    <div className="flex flex-col gap-[3em]">
      {/* Header */}
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
        <h2 className="font-heading font-bold text-[2em] sm:text-[2.5em] leading-[1.08] tracking-[-0.03em] text-text">
          {headline}
        </h2>
      </motion.div>

      {/* Two cards */}
      <div ref={cardsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-[1.5em]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={cardsInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        >
          <PathCard
            eyebrow={companyEyebrow}
            heading={companyHeading}
            body={companyBody}
            bullets={[companyB1, companyB2, companyB3]}
            ctaLabel={companyCta}
            ctaHref="/signup?role=company"
            ctaPrimary={true}
            surfaceClass="bg-(--accent-light)/25"
            borderClass="border-accent/15"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={cardsInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, delay: 0.28, ease: [0.4, 0, 0.2, 1] }}
        >
          <PathCard
            eyebrow={partnerEyebrow}
            heading={partnerHeading}
            body={partnerBody}
            bullets={[partnerB1, partnerB2, partnerB3]}
            ctaLabel={partnerCta}
            ctaHref="/signup?role=partner"
            ctaPrimary={false}
            surfaceClass="bg-bg-alt"
            borderClass="border-border-light"
          />
        </motion.div>
      </div>
    </div>
  );
}
