"use client";

/**
 * Avatar — round avatar with image or initials fallback.
 *
 * Props:
 *   name        : full display name — used for initials fallback + alt text
 *   src         : optional image URL (profile_photo / company logo). When
 *                 provided renders <Image /> with fill; falls back to initials
 *                 when absent or if the image errors.
 *   size        : "sm" (1.75em) | "md" (2.25em, default) | "lg" (2.75em)
 *   className   : extra Tailwind classes
 */

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: { box: "w-[1.75em] h-[1.75em]", text: "text-[0.625em]" },
  md: { box: "w-[2.25em] h-[2.25em]", text: "text-[0.75em]" },
  lg: { box: "w-[2.75em] h-[2.75em]", text: "text-[0.875em]" },
};

/** Two-letter initials from a display name. Falls back to "?" for empty. */
function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, src, size = "md", className }) {
  const { box, text } = SIZE[size];
  const [imgError, setImgError] = useState(false);
  const showImage = !!src && !imgError;

  return (
    <span
      className={cn(
        "shrink-0 relative inline-flex items-center justify-center rounded-full overflow-hidden",
        "bg-accent-light text-accent-text font-semibold tracking-[-0.02em]",
        box,
        className,
      )}
      aria-hidden="true"
    >
      {showImage ? (
        <Image
          src={src}
          alt={name ?? ""}
          fill
          sizes="3em"
          className="object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      ) : (
        <span className={text}>{getInitials(name)}</span>
      )}
    </span>
  );
}
