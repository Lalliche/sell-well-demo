"use client";

import { Users, Megaphone, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";

const ICON_MAP = {
  users:     Users,
  megaphone: Megaphone,
  list:      LayoutList,
};

export default function ProblemCards({ overline, headline, cards, closing }) {
  const [headerRef,  headerInView]  = useInView(0.2);
  const [cardsRef,   cardsInView]   = useInView(0.15);
  const [closingRef, closingInView] = useInView(0.5);

  return (
    <>
      {/* Section header — same fade-up as hero title */}
      <div
        ref={headerRef}
        className={cn(
          "flex flex-col items-center text-center mb-[3.5em]",
          headerInView ? "section-visible" : "section-hidden"
        )}
      >
        <p className="text-[0.6875em] font-semibold uppercase tracking-[0.08em] text-accent-text mb-[0.875em]">
          {overline}
        </p>
        <h2 className="font-heading font-bold text-[2em] sm:text-[2.5em] leading-[1.08] tracking-[-0.03em] text-text max-w-[18em]">
          {headline}
        </h2>
      </div>

      {/* 3-col card grid */}
      <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-3 gap-[1.5em]">
        {cards.map(({ iconKey, title, body }, i) => {
          const Icon = ICON_MAP[iconKey];
          return (
            <div
              key={title}
              className={cn(cardsInView ? "section-visible" : "section-hidden")}
              style={{ animationDelay: cardsInView ? `${i * 150}ms` : "0ms" }}
            >
              <div className="group bg-bg border border-border-light rounded-[0.625em] p-[2em] cursor-default hover:scale-[1.025] transition-transform duration-500 ease-out h-full">
                <div className="w-[2.75em] h-[2.75em] rounded-[0.625em] bg-(--accent-light) text-accent flex items-center justify-center mb-[1.25em] transition-transform duration-500 ease-out group-hover:scale-110">
                  <Icon size={20} strokeWidth={1.5} />
                </div>
                <h3 className="font-heading font-bold text-[1em] tracking-[-0.01em] text-text mb-[0.625em] transition-colors duration-300 ease-out group-hover:text-accent-text">
                  {title}
                </h3>
                <p className="text-[0.875em] leading-[1.6] text-text-secondary">
                  {body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Closing line */}
      <div
        ref={closingRef}
        className={cn(
          "mt-[3em] text-center",
          closingInView ? "section-visible" : "section-hidden"
        )}
      >
        <p className="font-heading font-bold text-[1.25em] sm:text-[1.5em] tracking-[-0.02em] text-text">
          {closing}
        </p>
      </div>
    </>
  );
}
