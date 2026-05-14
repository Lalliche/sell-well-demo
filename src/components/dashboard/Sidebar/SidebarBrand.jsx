"use client";

/**
 * SidebarBrand — non-interactive brand row at the top of the sidebar.
 *
 * Collapsed: logo mark only.
 * Expanded:  logo mark + "Sell" (dark) + "Well" (accent), sliding in
 *            from the left with a fade — smooth transition as sidebar
 *            expands/collapses.
 */

import Image from "next/image";
import LogoMark from "@/assets/Sellwell-logo-noBG.png";
import { cn } from "@/lib/utils";

export default function SidebarBrand({ collapsed }) {
  return (
    <div
      role="presentation"
      aria-label="SellWell"
      className={cn(
        "flex items-center gap-[0.5em] h-[3em] overflow-hidden",
        collapsed ? "justify-center px-0" : "justify-start px-[0.375em]",
      )}
    >
      {/* Logo mark — always visible */}
      <Image
        src={LogoMark}
        alt=""
        height={28}
        className="shrink-0 h-7 w-auto"
        priority
      />

      {/* Wordmark — slides in from the left and fades in when expanded,
          reverses on collapse. `translate-x` starts negative (off to the
          left, behind the icon) and moves to 0. `max-w` goes 0→full so
          the text doesn't push layout while animating. */}
      <span
        className={cn(
          "font-heading font-bold text-[1.25em] tracking-[-0.03em] whitespace-nowrap",
          "transition-[opacity,transform,max-width] duration-300 ease-out",
          collapsed
            ? "opacity-0 -translate-x-3 max-w-0 pointer-events-none"
            : "opacity-100 translate-x-0 max-w-[8em]",
        )}
      >
        <span className="text-text">Sell</span>
        <span className="text-accent">Well</span>
      </span>
    </div>
  );
}
