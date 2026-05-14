/**
 * Skeleton — Loading placeholder components with pulse animation.
 * Use instead of spinners for all async data surfaces.
 *
 * Exports:
 *   Skeleton          Base block — width, height, radius configurable
 *   SkeletonText      Single text line
 *   SkeletonAvatar    Circle avatar placeholder
 *   SkeletonCard      Generic card placeholder (label + value + trend)
 *   SkeletonTableRows N rows × M cols table body placeholder
 *   SkeletonStatRow   Row of N stat cards
 *
 * Base props:
 *   width     string | number CSS value (default: "100%")
 *   height    string | number CSS value (default: "1em")
 *   rounded   string Tailwind rounded class (default: "rounded-[0.375em]")
 *   className string
 *
 * Animation: skeleton-pulse keyframe defined in globals.css (1.5s ease-in-out infinite)
 */

import { cn } from "@/lib/utils";

export function Skeleton({ width = "100%", height = "1em", rounded = "rounded-[0.375em]", className, style }) {
  return (
    <div
      className={cn("bg-bg-alt", rounded, className)}
      style={{
        width,
        height,
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonText({ width = "60%", className }) {
  return <Skeleton width={width} height="0.875em" className={className} />;
}

export function SkeletonAvatar({ size = "2.5em" }) {
  return <Skeleton width={size} height={size} rounded="rounded-full" className="shrink-0" />;
}

export function SkeletonCard({ className }) {
  return (
    <div className={cn("bg-surface border border-border-light rounded-[0.625em] p-[1.375em] flex flex-col gap-[0.875em] shadow-xs", className)}>
      <SkeletonText width="40%" />
      <Skeleton width="55%" height="1.75em" rounded="rounded-[0.375em]" />
      <SkeletonText width="50%" />
    </div>
  );
}

export function SkeletonTableRows({ rows = 5, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-border-light">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-[1.25em] py-[0.875em]">
              <Skeleton height="0.875em" width={c === 0 ? "70%" : "50%"} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonStatRow({ count = 4, className }) {
  return (
    <div className={cn("grid gap-[1em]", className)} style={{ gridTemplateColumns: `repeat(${count}, 1fr)` }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
