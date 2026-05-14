"use client";

/**
 * PageHeader — top-of-page header used by every dashboard route inside
 * the white content card.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ [breadcrumbs (optional)]                                    │
 *   │ Title                                       [actions slot]  │
 *   │ Optional description / subtitle                             │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * Props:
 *   title         string — required. Renders as Sora h1, font-bold.
 *   description   ReactNode — optional 1-2 line subtitle below the title.
 *                 May be a plain string or any node.
 *   breadcrumbs   Array<{label, href}> — optional. Last crumb is rendered
 *                 inert (text-text), preceding crumbs as locale-aware
 *                 Links. Skip the prop entirely to hide breadcrumbs.
 *   actions       ReactNode — optional right-aligned slot for buttons.
 *
 * Spacing rule: the page header owns its own bottom margin (1.5em). Pages
 * should NOT add extra `mt-*` to their first content block.
 */

import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PageHeader({ title, description, breadcrumbs, actions }) {
  const hasBreadcrumbs = Array.isArray(breadcrumbs) && breadcrumbs.length > 0;

  return (
    <header className="flex flex-col gap-[0.375em] mb-[1.5em]">
      {hasBreadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      <div className="flex items-start justify-between gap-[1em] flex-wrap">
        <h1 className="font-heading font-bold text-[1.75em] tracking-[-0.02em] text-text leading-[1.15] min-w-0">
          {title}
        </h1>
        {actions && (
          <div className="shrink-0 flex items-center gap-[0.5em]">
            {actions}
          </div>
        )}
      </div>

      {description && (
        <p className="text-[0.9375em] text-text-secondary leading-[1.6] max-w-[55ch]">
          {description}
        </p>
      )}
    </header>
  );
}

/* ── Breadcrumbs ───────────────────────────────────────────────────────── */

function Breadcrumbs({ items }) {
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-[0.375em] flex-wrap">
        {items.map((item, i) => {
          const isLast = i === last;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-[0.375em]">
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-[0.75em] font-medium text-text"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "text-[0.75em] font-medium text-text-muted",
                    "hover:text-text transition-[color] duration-150 ease-out",
                    "focus-visible:outline-none focus-visible:underline",
                  )}
                >
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <ChevronRight
                  aria-hidden="true"
                  size="0.75em"
                  strokeWidth={2}
                  className="text-text-muted"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
