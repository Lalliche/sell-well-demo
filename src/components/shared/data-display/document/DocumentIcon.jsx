"use client";

/**
 * DocumentIcon — small wrapper that picks the right Lucide icon for a
 * given file kind. Pure presentation, no logic. Lives next to
 * DocumentCard but exported on its own so other surfaces (inline file
 * pills, table cells, breadcrumb-style references) can reuse the
 * iconography without pulling in the whole card.
 *
 * Tone: neutral (text-text-secondary on bg-bg-alt). Active / brand tone
 * is reserved for video kind so a partner spots the demo at a glance.
 */

import { FileText, FileType, Image as ImageIcon, Archive, Video, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_TO_ICON = {
  pdf:   FileText,
  pptx:  FileType,
  image: ImageIcon,
  zip:   Archive,
  video: Video,
  other: Link2,
};

const SIZE = {
  sm: "w-[2em] h-[2em]    rounded-[0.375em] text-[0.875em]",
  md: "w-[2.5em] h-[2.5em] rounded-[0.5em]   text-[1em]",
  lg: "w-[3em] h-[3em]    rounded-[0.625em] text-[1.125em]",
};

export default function DocumentIcon({ kind = "other", size = "md", className }) {
  const Icon = KIND_TO_ICON[kind] ?? Link2;
  const accent = kind === "video";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0",
        SIZE[size],
        accent ? "bg-accent-light text-accent" : "bg-bg-alt text-text-secondary",
        className,
      )}
      aria-hidden
    >
      <Icon className="w-[1em] h-[1em]" strokeWidth={1.75} />
    </span>
  );
}

export { KIND_TO_ICON };
