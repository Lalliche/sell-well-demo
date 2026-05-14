"use client";

import { useRef, useState, useId, useEffect, useCallback } from "react";
import {
  motion,
  useInView as useMotionInView,
  AnimatePresence,
} from "motion/react";
import {
  ClipboardList, Users, MessagesSquare, Banknote,
} from "lucide-react";

import StageCard from "./StageCard";
import ExpandedPanel from "./ExpandedPanel";

/* ──────────────────────────────────────────────────────────────────────────
 * HowItWorks — "Four stages, one fair handshake"
 *
 * Structure A (dual-narrative): List → Match → Sell → Settle.
 *
 * Behavior splits at the lg breakpoint (1150px):
 *  - Desktop: clicked card grows to full-row via origin-aware FLIP, others
 *    fade and scale to 0.97. Scene height is locked, then synced to the
 *    expanded panel's natural height; releases on collapse.
 *  - Mobile/tablet: clicked card expands inline as an accordion (bullet
 *    list reveals, icon swaps to X, CTA relabels to "Close"). Other cards
 *    stay visible and tappable.
 * ──────────────────────────────────────────────────────────────────────── */

const STAGES = [
  { id: "list",   badge: "01", icon: ClipboardList },
  { id: "match",  badge: "02", icon: Users },
  { id: "sell",   badge: "03", icon: MessagesSquare },
  { id: "settle", badge: "04", icon: Banknote },
];

// Matches --breakpoint-lg in globals.css.
const DESKTOP_QUERY = "(min-width: 1150px)";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

export default function HowItWorksClient({
  overline, headline, body, ctaLabel, closeLabel,
  stage1Title, stage1Blurb, stage1B1, stage1B2, stage1B3,
  stage2Title, stage2Blurb, stage2B1, stage2B2, stage2B3,
  stage3Title, stage3Blurb, stage3B1, stage3B2, stage3B3,
  stage4Title, stage4Blurb, stage4B1, stage4B2, stage4B3,
}) {
  const reactId = useId();

  const stagesData = [
    { ...STAGES[0], title: stage1Title, blurb: stage1Blurb, bullets: [stage1B1, stage1B2, stage1B3].filter(Boolean) },
    { ...STAGES[1], title: stage2Title, blurb: stage2Blurb, bullets: [stage2B1, stage2B2, stage2B3].filter(Boolean) },
    { ...STAGES[2], title: stage3Title, blurb: stage3Blurb, bullets: [stage3B1, stage3B2, stage3B3].filter(Boolean) },
    { ...STAGES[3], title: stage4Title, blurb: stage4Blurb, bullets: [stage4B1, stage4B2, stage4B3].filter(Boolean) },
  ];

  const headerRef = useRef(null);
  const sceneRef  = useRef(null);
  const gridRef   = useRef(null);
  const panelRef  = useRef(null);
  const cardRefs  = useRef({});

  // Low `amount` thresholds — on mobile the section can be much taller than
  // the viewport (4 stacked cards), so requiring 20-30% visibility means the
  // entrance animation never fires and the grid stays at opacity 0.
  const headerInView = useMotionInView(headerRef, { once: true, amount: 0.1 });
  const sceneInView  = useMotionInView(sceneRef,  { once: true, amount: 0.05, margin: "0px 0px -10% 0px" });

  const isDesktop = useIsDesktop();

  const [activeId, setActiveId] = useState(null);
  const [originRect, setOriginRect] = useState(null);
  const [sceneHeight, setSceneHeight] = useState(null);
  const activeStage = activeId ? stagesData.find((s) => s.id === activeId) : null;

  // Open. Desktop captures origin rect + scene width + locks grid height.
  // Mobile just sets activeId — the card expands inline, section reflows naturally.
  const handleOpen = useCallback((id) => {
    if (isDesktop) {
      const sceneEl = sceneRef.current;
      const cardEl  = cardRefs.current[id];
      const gridEl  = gridRef.current;
      if (sceneEl && cardEl) {
        const sceneRect = sceneEl.getBoundingClientRect();
        const cardRect  = cardEl.getBoundingClientRect();
        setOriginRect({
          top:    cardRect.top    - sceneRect.top,
          left:   cardRect.left   - sceneRect.left,
          width:  cardRect.width,
          height: cardRect.height,
          sceneWidth: sceneRect.width,
        });
      }
      if (gridEl) setSceneHeight(gridEl.offsetHeight);
    }
    setActiveId(id);
  }, [isDesktop]);

  const handleClose = useCallback(() => setActiveId(null), []);

  // Esc to close
  useEffect(() => {
    if (!activeId) return;
    const onKey = (e) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, handleClose]);

  // Desktop only: once expanded panel mounts, sync scene height to its natural
  // height after the spring settles, so the page below reflows smoothly.
  useEffect(() => {
    if (!activeId || !isDesktop) return;
    const sync = () => {
      const h = panelRef.current?.offsetHeight;
      if (h) setSceneHeight(h);
    };
    const t1 = window.setTimeout(sync, 700);
    window.addEventListener("resize", sync);
    return () => {
      window.clearTimeout(t1);
      window.removeEventListener("resize", sync);
    };
  }, [activeId, isDesktop]);

  // After collapse, release the height lock.
  useEffect(() => {
    if (activeId) return;
    if (sceneHeight === null) return;
    const t = window.setTimeout(() => setSceneHeight(null), 480);
    return () => window.clearTimeout(t);
  }, [activeId, sceneHeight]);

  // On mobile we never honor the captured height. Derived during render so
  // resizing across the breakpoint doesn't trigger cascading effects.
  const effectiveSceneHeight = isDesktop ? sceneHeight : null;

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

      {/* Scene — relative wrapper. Desktop: height locks at grid height on
          open, animates to expanded panel's height. Mobile: stays auto so
          the inline-expanding card pushes the section taller naturally. */}
      <motion.div
        ref={sceneRef}
        className="relative"
        animate={{ height: effectiveSceneHeight ?? "auto" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: 0 }}
      >
        {/* Grid — opacity not gated by sceneInView on the container so cards
            stay visible+tappable even if entrance trigger fails. Desktop:
            when active, grid goes absolute + fades + scales down so the FLIP
            panel can take over. Mobile: grid stays in flow at full opacity. */}
        <motion.ul
          ref={gridRef}
          aria-hidden={isDesktop && activeId ? true : undefined}
          animate={{
            opacity: isDesktop && activeId ? 0 : 1,
            scale:   isDesktop && activeId ? 0.97 : 1,
          }}
          transition={{ duration: isDesktop && activeId ? 0.24 : 0.4, ease: [0.4, 0, 0.2, 1] }}
          className={(isDesktop && activeId ? "absolute inset-x-0 top-0 pointer-events-none " : "relative ") +
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1.5em] m-0 p-0 list-none"}
        >
          {stagesData.map((stage, i) => {
            const panelId = `${reactId}-panel-${stage.id}`;
            const titleId = `${reactId}-title-${stage.id}`;
            const isActive = activeId === stage.id;
            const isInlineExpanded = !isDesktop && isActive;
            return (
              <motion.li
                key={stage.id}
                className="list-none"
                initial={{ opacity: 0, y: 28 }}
                animate={sceneInView ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1], delay: 0.15 + i * 0.1 }}
              >
                <StageCard
                  stage={stage}
                  panelId={panelId}
                  titleId={titleId}
                  ctaLabel={ctaLabel}
                  closeLabel={closeLabel}
                  onOpen={() => handleOpen(stage.id)}
                  onClose={handleClose}
                  registerRef={(el) => { cardRefs.current[stage.id] = el; }}
                  isActive={isActive}
                  isInlineExpanded={isInlineExpanded}
                />
              </motion.li>
            );
          })}
        </motion.ul>

        {/* Desktop-only absolute FLIP panel, animates from origin rect to full row. */}
        <AnimatePresence mode="wait">
          {isDesktop && activeStage && (
            <ExpandedPanel
              key={activeStage.id}
              ref={panelRef}
              stage={activeStage}
              panelId={`${reactId}-panel-${activeStage.id}`}
              titleId={`${reactId}-title-${activeStage.id}`}
              originRect={originRect}
              onClose={handleClose}
              closeLabel={closeLabel}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
