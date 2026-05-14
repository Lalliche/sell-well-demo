"use client";

/**
 * Popover — small floating panel anchored to a trigger element.
 *
 * Built for the dashboard header's NotificationBell and UserAvatarMenu,
 * the sidebar's collapsed-mode language picker, and any other click-to-open
 * dropdown panel.
 *
 * **Binary API.** The caller passes a single `open: boolean` and an
 * `onClose` callback. There are no external phases. Internally, the
 * Popover keeps two booleans:
 *
 *   `mounted` — whether the DOM node should exist. Goes true on the first
 *               render where `open === true`. Goes false EXIT_MS after the
 *               last render where `open === false`, allowing the close
 *               animation to play before the node is removed.
 *
 *   `visible` — whether the panel has its open visual state (`opacity:1`,
 *               `translateY(0)`). Trails `mounted`'s open transition by one
 *               animation frame so the CSS transition has a "from" state
 *               (mounted but invisible) and a "to" state (visible) to
 *               interpolate between.
 *
 * Both booleans flip in sync with `open` after a short callback (rAF or
 * setTimeout) — never a synchronous `setState` inside an effect body. Per
 * the project hard rule (`nextjs-architecture.md` → "setState in useEffect").
 *
 * **Interruptible.** If `open` flips back to `true` while the panel is
 * still in its closing visual state (`mounted=true, visible=false, open=true`
 * mid-exit), the next render flips `visible` back to `true` and the same
 * CSS transition reverses smoothly. No remount, no flicker.
 *
 * Closing: clicking outside, pressing Escape, or `open` flipping to false.
 *
 * Props:
 *   open        boolean
 *   onClose     () => void
 *   placement   "bottom" (default) | "top" — which side of the trigger the
 *                panel hangs off. Use "top" inside bottom-of-viewport
 *                triggers (e.g. sidebar bottom dock) so the panel doesn't
 *                render off-screen.
 *   align       "right" (default) | "left" — which edge of the panel aligns
 *                to the trigger column.
 *   anchor      DEPRECATED alias for `align` — kept so original callers
 *                keep working.
 *   triggerRef  ref to the trigger element (recommended). When provided,
 *                pointerdowns inside the trigger are ignored by the
 *                outside-click handler — the trigger's own onClick handles
 *                the toggle without competing with the document listener.
 *   className   extra classes on the panel (sizing, padding, etc.)
 *   children    panel content
 *
 * Caller responsibility: wrap the trigger and Popover together in a
 * `position: relative` container so `absolute` positioning is anchored
 * to the trigger column.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ENTER_MS = 180;
const EXIT_MS  = 140;

export default function Popover({
  open,
  onClose,
  placement = "bottom",
  align,
  anchor,
  triggerRef,
  className,
  children,
}) {
  const resolvedAlign = align ?? anchor ?? "right";
  const isTop = placement === "top";

  // Two private booleans — never exposed. `mounted` controls DOM presence,
  // `visible` controls the open vs closed visual state.
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const panelRef = useRef(null);

  /* ── Mount driver. ────────────────────────────────────────────────────────
   * `open=true`  → mount immediately if not already mounted.
   * `open=false` → unmount EXIT_MS later, allowing the close animation to
   *                play. The setTimeout is the only place that flips
   *                `mounted` to false; if `open` flips back to true within
   *                EXIT_MS, the cleanup cancels the pending unmount and
   *                the panel never disappears.
   *
   * No synchronous setState in the effect body — both transitions are
   * wrapped in a callback (rAF or setTimeout). */
  useEffect(() => {
    let rafId, timerId;

    if (open && !mounted) {
      rafId = requestAnimationFrame(() => setMounted(true));
    } else if (!open && mounted) {
      timerId = setTimeout(() => setMounted(false), EXIT_MS);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
  }, [open, mounted]);

  /* ── Visibility driver. ───────────────────────────────────────────────────
   * `visible` mirrors `open`, but with a one-rAF delay on the open
   * direction so the CSS transition has a starting frame (mounted but
   * not yet visible) to interpolate from. On close, `visible` flips to
   * false immediately on the next frame so the exit transition starts
   * playing before the unmount timer expires. */
  useEffect(() => {
    let rafId;

    if (open && mounted && !visible) {
      // Wait one frame after mounting so the browser sees a layout pass
      // with `opacity:0` before flipping to `opacity:1`. Otherwise the
      // CSS transition has no "from" state and the panel pops in.
      rafId = requestAnimationFrame(() => setVisible(true));
    } else if (!open && visible) {
      rafId = requestAnimationFrame(() => setVisible(false));
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open, mounted, visible]);

  /* ── Outside-click + Escape — active only when fully open and visible. */
  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    const onPointer = (e) => {
      const inPanel = panelRef.current?.contains(e.target);
      const inTrigger = triggerRef?.current?.contains(e.target);
      if (!inPanel && !inTrigger) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [visible, onClose, triggerRef]);

  if (!mounted) return null;

  const enterOffset = isTop ? "translateY(0.25em)" : "translateY(-0.25em)";
  const dur = visible ? `${ENTER_MS}ms` : `${EXIT_MS}ms`;

  return (
    <div
      ref={panelRef}
      role="dialog"
      className={cn(
        "absolute z-50 bg-surface rounded-[0.75em] shadow-lg",
        "border border-border-light",
        isTop ? "bottom-[calc(100%+0.5em)]" : "top-[calc(100%+0.5em)]",
        resolvedAlign === "right" ? "right-0" : "left-0",
        className,
      )}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : enterOffset,
        transition: `opacity ${dur} ease-out, transform ${dur} ease-out`,
      }}
    >
      {children}
    </div>
  );
}
