"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import AppButton from "@/components/ui/Buttons";
import HeroMockup from "@/components/landing/HeroMockup";
import { useInView } from "@/hooks/useInView";

export default function Hero() {
  const t = useTranslations("Hero");
  const sectionRef = useRef(null);
  const mockupRef = useRef(null);
  const [mockupWrapRef, mockupInView] = useInView(0.1);

  // Cursor-follow spotlight — sets CSS custom props on the section element
  useEffect(() => {
    const onMove = (e) => {
      const hero = sectionRef.current;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
      hero.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Scroll-driven 3D tilt on mockup — dynamic value, must use style.transform
  useEffect(() => {
    const onScroll = () => {
      if (!mockupRef.current || !mockupWrapRef.current) return;
      const rect = mockupWrapRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, 1 - rect.top / window.innerHeight));
      const tilt = (1 - progress) * 8;
      const scale = 0.96 + progress * 0.04;
      mockupRef.current.style.transform = `perspective(2400px) rotateX(${tilt}deg) scale(${scale})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mockupWrapRef]);

  return (
    <section
      ref={sectionRef}
      className="hero-section relative overflow-hidden py-[5em] "
    >
      {/* Dot grid */}
      <div aria-hidden="true" className="hero-bg-grid" />
      {/* Cursor spotlight */}
      <div aria-hidden="true" className="hero-bg-spotlight" />

      {/* Text content — centered column */}
      <div className="relative z-2 max-w-[75em] mx-auto px-[2em]">
        <div className="flex flex-col items-center text-center max-w-[55em] mx-auto">

          {/* Pill badge */}
          <div className="hero-entrance-0 inline-flex items-center gap-0 bg-surface border border-border-light rounded-full shadow-xs cursor-pointer mb-[2em] pl-[0.875em] pr-[0.25em] py-[0.25em]">
            <span className="text-[0.8125em] font-medium text-text-secondary pr-[0.5em]">
              {t("badge")}
            </span>
            <span className="inline-flex items-center gap-[0.375em] bg-accent text-white text-[0.75em] font-semibold px-[0.75em] py-[0.3em] rounded-full">
              New <ArrowRight size={11} strokeWidth={2.5} />
            </span>
          </div>

          {/* Headline — static, 2 lines */}
          <h1 className="hero-entrance-1 font-heading font-extrabold text-text text-[2.75em] sm:text-[3.5em] lg:text-[4.75em] leading-[1.02] tracking-[-0.045em] mb-[0.375em] text-center w-full">
            <span className="block">{t("headlineLine1")}</span>
            <span className="block">{t("headlineLine2")}</span>
          </h1>

          {/* Sub-copy */}
          <p className="hero-entrance-2 text-[1.1875em] leading-[1.55] text-text-secondary max-w-[36em] mb-[2.5em] text-balance text-center">
            {t("subCopy")}
          </p>

          {/* CTA buttons */}
          <div className="hero-entrance-3 flex items-center gap-[0.75em] flex-wrap justify-center mb-[1.5em]">
            <Link href="/signup">
              <AppButton variant="primary" size="lg" className="gap-[0.5em] shadow-[0_1px_2px_rgba(0,0,0,0.1),0_8px_24px_rgba(26,26,26,0.18),inset_0_1px_0_rgba(255,255,255,0.1)]">
                {t("ctaPrimary")} <ArrowRight size={16} strokeWidth={2.2} />
              </AppButton>
            </Link>
            <Link href="/#how-it-works">
              <AppButton variant="secondary" size="lg" className="gap-[0.5em]">
                <Play size={14} strokeWidth={2} />
                {t("ctaSecondary")}
              </AppButton>
            </Link>
          </div>

          {/* Trust note */}
          <div className="hero-entrance-4 inline-flex items-center gap-[0.5em] text-[0.8125em] text-text-muted">
            <span className="w-[0.375em] h-[0.375em] rounded-full bg-trend-positive shrink-0 animate-[pulse-green_2s_infinite]" />
            {t("ctaNote")}
          </div>

        </div>
      </div>

      {/* Mockup — IntersectionObserver-triggered entrance */}
      <div
        ref={mockupWrapRef}
        className={cn(
          "hidden md:block relative z-2 max-w-[80em] mx-auto px-[2em] mt-[5em]",
          "transition-[opacity,transform] duration-1000 ease-in-out",
          mockupInView
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-[3.75em]"
        )}
      >
        <div aria-hidden="true" className="hero-mockup-glow" />
        <div ref={mockupRef} className="hero-mockup-tilt">
          <HeroMockup />
        </div>
      </div>
    </section>
  );
}
