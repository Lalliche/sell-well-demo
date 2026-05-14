"use client";

/**
 * TrustStrip — calm, hairline-bordered banner that names the trust
 * fact at the top of /escrow/fund and /escrow/withdraw. Pattern lifted
 * from Brex / Upwork ("Funds in Checking are provided by Column N.A.,
 * Member FDIC") but adapted to SellWell's actual custody model: we
 * don't claim third-party trust we don't have. Instead we name the
 * operational trust signal — refundability + control on fund,
 * process + cancellation on withdraw.
 *
 * The icon comes from the caller — Shield for fund, Clock or Lock for
 * withdraw — so the same component reads slightly differently on each
 * surface without duplicating layout.
 */

import { cn } from "@/lib/utils";

export default function TrustStrip({
  icon: Icon,
  title,
  body,
  className,
  variant = "neutral",
}) {
  const tone =
    variant === "neutral"
      ? "bg-bg-alt border-border-light"
      : "bg-status-active-bg border-accent-border";
  return (
    <div
      className={cn(
        "flex items-start gap-[0.75em] px-[1em] py-[0.875em] rounded-[0.625em] border",
        tone,
        className,
      )}
    >
      {Icon && (
        <span className="shrink-0 inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-full bg-surface text-accent">
          <Icon className="w-[1em] h-[1em]" strokeWidth={1.75} />
        </span>
      )}
      <div className="flex flex-col gap-[0.125em] min-w-0">
        <p className="text-[0.8125em] font-semibold text-text font-body leading-[1.4]">
          {title}
        </p>
        <p className="text-[0.75em] text-text-secondary font-body leading-[1.5]">
          {body}
        </p>
      </div>
    </div>
  );
}
