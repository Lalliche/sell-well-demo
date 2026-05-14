/**
 * EmptyState — Zero-data placeholder for tables, lists, and pages.
 *
 * Props:
 *   icon      ReactNode — Lucide/react-icon (rendered at 2em, muted stroke 1.5)
 *   title     string — main heading
 *   subtitle  string — optional helper text
 *   action    ReactNode — optional CTA (AppButton, link, etc.)
 *   className string
 *
 * States:
 *   default (icon + title + subtitle) · with action CTA · minimal (title only)
 */

import { cn } from "@/lib/utils";

export default function EmptyState({ icon, title, subtitle, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-[0.75em] min-h-[15em] py-[2em] px-[1em] text-center",
        className,
      )}
    >
      {icon && (
        <span className="text-border-strong" style={{ fontSize: "2.25em", lineHeight: 1 }}>
          {icon}
        </span>
      )}
      <p className="text-[0.9375em] font-semibold text-text font-body">{title}</p>
      {subtitle && (
        <p className="text-[0.8125em] text-text-secondary font-body max-w-[24em]">{subtitle}</p>
      )}
      {action && <div className="mt-[0.25em]">{action}</div>}
    </div>
  );
}
