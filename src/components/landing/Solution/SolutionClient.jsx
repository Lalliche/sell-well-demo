"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView as useMotionInView,
} from "motion/react";
import {
  CheckCircle2, Phone, Users, Briefcase, FileText, Handshake,
  BadgeCheck, Banknote, Sparkles, Megaphone,
  TrendingDown, TrendingUp,
} from "lucide-react";

import EventRow from "./EventRow";
import ClockTime from "./ClockTime";
import {
  CallLogDetail, TeamCostDetail, MonthEndDetail, MarketingSpendDetail,
  SetupDetail, LeadDeliveredDetail, DemoDetail, ClosedDealDetail, PaidOnResultDetail,
} from "./details";

/* ──────────────────────────────────────────────────────────────────────────
 * Solution — "Two Months, Two Realities" (scroll-driven, hover detail)
 *
 *  - Independent event timelines per side (no time compatibility).
 *  - Each event has a hover popover with rich, real-looking detail.
 *  - Popovers auto-flip above ↔ below based on viewport space.
 *  - All copy via next-intl (en + fr).
 *  - Currency rendered as "DZD" (not Arabic glyph) for both locales.
 * ──────────────────────────────────────────────────────────────────────── */

export default function SolutionClient({
  overline, headline, body,
  bullet1, bullet2, bullet3,
}) {
  const t = useTranslations("Solution");

  // Build event arrays here so titles/subs/badges respect the active locale
  const LEFT_EVENTS = [
    { id: "calls",     y: 0.05, icon: Phone,     title: t("leftEvent1Title"), sub: t("leftEvent1Sub"), DetailContent: CallLogDetail },
    { id: "team",      y: 0.32, icon: Users,     title: t("leftEvent2Title"), sub: t("leftEvent2Sub"), badge: "−280,000 DZD", DetailContent: TeamCostDetail },
    { id: "marketing", y: 0.58, icon: Megaphone, title: t("leftEvent3Title"), sub: t("leftEvent3Sub"), badge: "−20,000 DZD",  DetailContent: MarketingSpendDetail },
    { id: "month",     y: 0.88, icon: FileText,  title: t("leftEvent4Title"), sub: t("leftEvent4Sub"), badge: "+360,000 DZD", isPositive: true, DetailContent: MonthEndDetail },
  ];

  const RIGHT_EVENTS = [
    { id: "setup",  y: 0.05, icon: Sparkles,   title: t("rightEvent1Title"), sub: t("rightEvent1Sub"), DetailContent: SetupDetail },
    { id: "lead",   y: 0.28, icon: Handshake,  title: t("rightEvent2Title"), sub: t("rightEvent2Sub"), DetailContent: LeadDeliveredDetail },
    { id: "demo",   y: 0.50, icon: Briefcase,  title: t("rightEvent3Title"), sub: t("rightEvent3Sub"), DetailContent: DemoDetail },
    { id: "closed", y: 0.72, icon: BadgeCheck, title: t("rightEvent4Title"), sub: t("rightEvent4Sub"), badge: "+180,000 DZD", DetailContent: ClosedDealDetail },
    { id: "paid",   y: 0.92, icon: Banknote,   title: t("rightEvent5Title"), sub: t("rightEvent5Sub"), DetailContent: PaidOnResultDetail },
  ];

  const headerRef          = useRef(null);
  const bulletsRef         = useRef(null);
  const totalsRef          = useRef(null);
  const scrollContainerRef = useRef(null);

  const headerInView  = useMotionInView(headerRef,  { once: true, amount: 0.3 });
  const bulletsInView = useMotionInView(bulletsRef, { once: true, amount: 0.3 });
  const totalsInView  = useMotionInView(totalsRef,  { once: true, amount: 0.5 });

  const { scrollYProgress } = useScroll({
    target: scrollContainerRef,
    offset: ["start 80%", "end 100%"],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 90, damping: 30 });
  const timePillY = useTransform(smoothProgress, [0, 1], ["0%", "100%"]);

  const bullets = [bullet1, bullet2, bullet3];

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
        <h2 className="font-heading font-bold text-[2em] sm:text-[2.5em] leading-[1.08] tracking-[-0.03em] text-text mb-[0.875em]">
          {headline}
        </h2>
        <p className="text-[1.0625em] leading-[1.65] text-text-secondary">
          {body}
        </p>
      </motion.div>

      {/* Container */}
      <div
        ref={scrollContainerRef}
        className="relative bg-surface border border-border-light rounded-[1em] p-[1.5em] sm:p-[2em] overflow-visible"
        style={{
          boxShadow:
            "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.06), 0 24px 64px -16px rgba(15,23,42,0.08)",
        }}
      >
        {/* Column header pills */}
        <div className="grid grid-cols-2 gap-[2em] sm:gap-[3em] mb-[1.75em]">
          <div className="flex flex-col gap-[0.625em]">
            <span className="inline-flex items-center gap-[0.4375em] self-start bg-trend-negative/10 text-trend-negative font-body text-[0.8125em] font-bold uppercase tracking-[0.08em] px-[0.75em] py-[0.375em] rounded-full">
              <TrendingDown size={13} strokeWidth={2.25} />
              {t("withoutPill")}
            </span>
            <p className="font-body text-[0.875em] text-text-secondary leading-snug">
              {t("withoutSub")}
            </p>
          </div>
          <div className="flex flex-col gap-[0.625em]">
            <span className="inline-flex items-center gap-[0.4375em] self-start bg-(--accent-light) text-accent-text font-body text-[0.8125em] font-bold uppercase tracking-[0.08em] px-[0.75em] py-[0.375em] rounded-full border border-[--accent-border]">
              <TrendingUp size={13} strokeWidth={2.25} />
              {t("withPill")}
            </span>
            <p className="font-body text-[0.875em] text-text-secondary leading-snug">
              {t("withSub")}
            </p>
          </div>
        </div>

        {/* Two columns + center rail with clock pill */}
        <div className="relative grid grid-cols-2 gap-[2em] sm:gap-[3em] min-h-[20em]">
          <motion.div
            className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-0.5 bg-border-light"
            aria-hidden="true"
          >
            <motion.div
              className="absolute left-0 right-0 top-0 bg-accent/50"
              style={{ height: timePillY }}
            />
            <motion.div
              style={{ top: timePillY, position: "absolute", left: "50%", x: "-50%" }}
              className="z-10"
            >
              <div className="px-[0.5em] py-[0.1875em] rounded-[0.375em] bg-surface border border-accent/40 font-mono text-[0.625em] font-semibold text-text shadow-md whitespace-nowrap tabular-nums">
                <ClockTime progress={smoothProgress} />
              </div>
            </motion.div>
          </motion.div>

          <div className="relative pr-[0.5em] sm:pr-[1em]">
            <div className="relative h-full min-h-[20em]">
              {LEFT_EVENTS.map((event) => (
                <EventRow key={event.id} event={event} progress={smoothProgress} side="left" />
              ))}
            </div>
          </div>

          <div className="relative pl-[0.5em] sm:pl-[1em]">
            <div className="relative h-full min-h-[20em]">
              {RIGHT_EVENTS.map((event) => (
                <EventRow key={event.id} event={event} progress={smoothProgress} side="right" />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom totals */}
        <motion.div
          ref={totalsRef}
          initial={{ opacity: 0, y: 12 }}
          animate={totalsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-[2em] pt-[1.25em] border-t border-border-light grid grid-cols-2 gap-[2em] sm:gap-[3em]"
        >
          <div>
            <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-text-muted mb-[0.375em]">
              {t("netResult")}
            </p>
            <div className="flex items-baseline gap-[0.375em]">
              <span className="font-heading text-[1.5em] sm:text-[1.75em] font-bold text-text-secondary tabular-nums whitespace-nowrap">
                +60,000
              </span>
              <span className="font-mono text-[0.75em] font-semibold text-text-secondary">DZD</span>
            </div>
            <p className="font-body text-[0.75em] text-text-muted mt-[0.25em]">
              {t("leftNetCaption")}
            </p>
          </div>
          <div>
            <p className="font-body text-[0.625em] font-semibold uppercase tracking-[0.08em] text-accent-text mb-[0.375em]">
              {t("netResult")}
            </p>
            <div className="flex items-baseline gap-[0.375em]">
              <span className="font-heading text-[1.5em] sm:text-[1.75em] font-bold text-trend-positive tabular-nums whitespace-nowrap">
                +144,000
              </span>
              <span className="font-mono text-[0.75em] font-semibold text-trend-positive">DZD</span>
            </div>
            <p className="font-body text-[0.75em] text-text-muted mt-[0.25em]">
              {t("rightNetCaption")}
            </p>
          </div>
        </motion.div>

      </div>

      <p className="text-center text-[0.6875em] text-text-muted opacity-60">
        {t("hoverHint")}
      </p>

      {/* Bullets */}
      <motion.div
        ref={bulletsRef}
        className="grid grid-cols-1 sm:grid-cols-3 gap-[1.5em] max-w-[60em] mx-auto"
        initial="hidden"
        animate={bulletsInView ? "visible" : "hidden"}
        variants={{ visible: { transition: { staggerChildren: 0.12 } }, hidden: {} }}
      >
        {bullets.map((text, i) => (
          <motion.div key={i} className="flex items-start gap-[0.75em]"
            variants={{
              hidden:  { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
            }}>
            <CheckCircle2 size={18} strokeWidth={2} className="text-accent shrink-0 mt-[0.125em]" />
            <p className="text-[0.9375em] leading-[1.55] text-text-secondary">{text}</p>
          </motion.div>
        ))}
      </motion.div>

    </div>
  );
}
