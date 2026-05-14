"use client";

/**
 * DetailSkeleton — loading state for the campaign detail page.
 *
 * Mirrors the 8/4 split so the layout doesn't jump when data lands. Pulse
 * driven by the skeleton-pulse keyframe in globals.css.
 */

const Bar = ({ className = "" }) => (
  <span
    className={`block bg-bg-alt rounded-[0.25em] ${className}`}
    style={{ animation: "skeleton-pulse 1.4s ease-in-out infinite" }}
  />
);

export default function DetailSkeleton() {
  return (
    <div className="px-[2em] py-[2em] flex flex-col gap-[1.25em]">
      <Bar className="h-[0.875em] w-[10em]" />
      <div className="flex flex-col lg:flex-row gap-[2em] items-start">
        <div className="flex-1 min-w-0 w-full flex flex-col gap-[1.5em]">
          {/* Hero meta + title */}
          <div className="flex flex-col gap-[1em]">
            <div className="flex items-center gap-[0.625em]">
              <Bar className="w-[2.25em] h-[2.25em] rounded-[0.375em]" />
              <div className="flex flex-col gap-[0.375em]">
                <Bar className="h-[0.875em] w-[8em]" />
                <Bar className="h-[0.625em] w-[5em]" />
              </div>
            </div>
            <Bar className="h-[2em] w-[60%]" />
            <Bar className="h-[1em] w-[80%]" />
            <Bar className="aspect-[16/9] w-full rounded-[0.75em]" />
          </div>
          {/* Sections */}
          <div className="flex flex-col gap-[1.5em]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-[0.625em]">
                <Bar className="h-[1em] w-[8em]" />
                <Bar className="h-[0.875em] w-full" />
                <Bar className="h-[0.875em] w-[90%]" />
                <Bar className="h-[0.875em] w-[60%]" />
              </div>
            ))}
          </div>
        </div>
        {/* Right rail */}
        <div className="hidden lg:block w-[22em] shrink-0">
          <div className="flex flex-col gap-[1em] p-[1.25em] bg-surface border border-border-light rounded-[0.75em]">
            <Bar className="h-[0.625em] w-[6em]" />
            <Bar className="h-[1.5em] w-[10em]" />
            <Bar className="h-[1px] w-full" />
            <Bar className="h-[0.625em] w-[5em]" />
            <Bar className="h-[2em] w-full rounded-[0.5em]" />
            <Bar className="h-[2em] w-full rounded-[0.5em]" />
            <Bar className="h-[2em] w-full rounded-[0.5em]" />
            <Bar className="h-[1px] w-full" />
            <Bar className="h-[2.5em] w-full rounded-[0.5em]" />
          </div>
        </div>
      </div>
    </div>
  );
}
