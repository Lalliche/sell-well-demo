"use client";

/**
 * ComingSoon — full-page placeholder for routes that are wired into the
 * sidebar but not yet built. Lives inside the dashboard shell so the
 * sidebar + topbar stay in place; the content area gets a centered card
 * with an icon, title, and one-line body.
 *
 * Used heavily during the V1 build-out to avoid 404s on routes the user
 * can navigate to from the nav. Replace each call site with the real
 * page when that phase ships.
 */

import { Construction } from "lucide-react";

export default function ComingSoon({
  eyebrow,
  title,
  body,
  icon: Icon = Construction,
}) {
  return (
    <div className="flex-1 flex items-center justify-center px-[2em] py-[3em]">
      <div className="flex flex-col items-center text-center gap-[0.875em] max-w-[32em]">
        <span className="inline-flex items-center justify-center w-[3em] h-[3em] rounded-full bg-accent-light text-accent-text">
          <Icon className="w-[1.25em] h-[1.25em]" strokeWidth={1.5} />
        </span>
        {eyebrow && (
          <span className="text-[0.6875em] font-semibold tracking-[0.08em] uppercase text-text-muted">
            {eyebrow}
          </span>
        )}
        <h1 className="font-heading text-[1.5em] font-bold tracking-[-0.02em] text-text leading-[1.2]">
          {title}
        </h1>
        {body && (
          <p className="text-[0.9375em] text-text-secondary leading-[1.55] max-w-[40ch]">
            {body}
          </p>
        )}
      </div>
    </div>
  );
}
