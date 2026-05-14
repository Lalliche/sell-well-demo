"use client";

/**
 * DocumentCard — single source of truth for displaying any document or
 * external resource (PDF, PPTX, image, ZIP, video URL, link) in the
 * project. Used by the marketplace Sales Kit, lead attachments, the
 * withdrawal-proof column on /earnings, dispute proof uploads, partner
 * CV download on the company-side application review, etc.
 *
 * Three layout variants:
 *   - "grid" (default) : full card with icon, title, subtitle, meta row,
 *                        and Preview + Download buttons. Designed for a
 *                        2-column responsive grid.
 *   - "row"            : compact horizontal list-row. Same data, denser
 *                        visual. For dense surfaces (tables, sidebars).
 *   - "attachment"     : inline pill (icon + title + size). Smallest
 *                        footprint. For breadcrumb-style references
 *                        inside paragraphs / metadata strips.
 *
 * Props (`document`):
 *   kind         "file" | "url"
 *   fileUrl      string (when kind === "file")
 *   externalUrl  string (when kind === "url" — YouTube/Loom/Vimeo/etc.)
 *   title        display title (auto-set by the feature wrapper, e.g. "Pitch Deck")
 *   subtitle?    optional secondary line ("Updated 3d ago", filename, …)
 *   sizeBytes?   number — appended to subtitle when present
 *   updatedAt?   ISO string — when the feature wants the card to compute
 *                its own "Updated 3d ago" instead of building the subtitle
 *
 * Props (component):
 *   variant       "grid" | "row" | "attachment"
 *   onPreview     (document) => void  — opens the shared preview modal
 *                 owned by the parent. When omitted, the Preview button
 *                 is hidden (some surfaces force download-only).
 *   labels        { preview, download, watch, openInNewTab, updatedAt }
 *                 — localized strings the caller threads in. Keeps this
 *                 component i18n-agnostic.
 *
 * Hover affordance per the project's interactive-card memory rule:
 *   bg-surface → bg-surface-hover, shadow-xs → shadow-md, no appearing
 *   border, no scale on the card body itself. Buttons are AppButton so
 *   they bring their own micro-interactions.
 */

import { Link as LinkIcon, Download, Play, Eye, ExternalLink } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { cn } from "@/lib/utils";
import {
  inferFileKind,
  fileNameFromUrl,
  formatFileSize,
} from "@/lib/format/file";
import DocumentIcon from "./DocumentIcon";

export default function DocumentCard({
  document: doc,
  variant = "grid",
  onPreview,
  labels = {},
  className,
}) {
  if (!doc) return null;
  const kind = inferFileKind({
    kind: doc.kind,
    fileUrl: doc.fileUrl,
    externalUrl: doc.externalUrl,
  });
  const downloadHref = doc.kind === "url" ? doc.externalUrl : doc.fileUrl;
  const isVideo = kind === "video";
  const canPreview = (kind === "pdf" || kind === "image" || kind === "video") && !!onPreview;

  const subtitleParts = [
    doc.subtitle,
    typeof doc.sizeBytes === "number" ? formatFileSize(doc.sizeBytes) : null,
  ].filter(Boolean);
  const subtitle = subtitleParts.join(" · ");

  if (variant === "attachment") {
    return (
      <AttachmentPill
        doc={doc}
        kind={kind}
        href={downloadHref}
        labels={labels}
        className={className}
      />
    );
  }

  if (variant === "row") {
    return (
      <RowCard
        doc={doc}
        kind={kind}
        subtitle={subtitle}
        href={downloadHref}
        canPreview={canPreview}
        isVideo={isVideo}
        onPreview={onPreview}
        labels={labels}
        className={className}
      />
    );
  }

  // grid (default)
  return (
    <GridCard
      doc={doc}
      kind={kind}
      subtitle={subtitle}
      href={downloadHref}
      canPreview={canPreview}
      isVideo={isVideo}
      onPreview={onPreview}
      labels={labels}
      className={className}
    />
  );
}

/* ── Grid variant ────────────────────────────────────────────────────── */

function GridCard({ doc, kind, subtitle, href, canPreview, isVideo, onPreview, labels, className }) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-[0.875em] p-[1em] bg-surface rounded-[0.625em] border border-border-light shadow-xs",
        "hover:bg-surface-hover hover:shadow-md",
        "transition-[background-color,box-shadow] duration-200 ease-out",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-[0.625em] min-w-0">
        <DocumentIcon kind={kind} size="md" />
        <div className="flex flex-col flex-1 min-w-0 gap-[0.125em]">
          <span className="text-[0.875em] font-semibold text-text leading-[1.3] truncate">
            {doc.title}
          </span>
          {subtitle && (
            <span className="text-[0.75em] text-text-muted truncate">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-[0.375em]">
        {canPreview && (
          <AppButton
            variant="secondary"
            size="sm"
            onClick={() => onPreview(doc)}
            className="flex-1"
          >
            <span className="inline-flex items-center gap-[0.375em]">
              {isVideo ? (
                <Play className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
              ) : (
                <Eye className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
              )}
              {isVideo ? (labels.watch ?? "Watch") : (labels.preview ?? "Preview")}
            </span>
          </AppButton>
        )}
        {href && (
          <a
            href={href}
            target={doc.kind === "url" ? "_blank" : undefined}
            rel={doc.kind === "url" ? "noopener noreferrer" : undefined}
            download={doc.kind === "file" || undefined}
            className={cn("inline-block", canPreview ? "" : "flex-1")}
          >
            <AppButton variant="primary" size="sm" className="w-full">
              <span className="inline-flex items-center gap-[0.375em]">
                {doc.kind === "url" ? (
                  <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
                ) : (
                  <Download className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
                )}
                {doc.kind === "url"
                  ? (labels.openInNewTab ?? "Open")
                  : (labels.download ?? "Download")}
              </span>
            </AppButton>
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Row variant ─────────────────────────────────────────────────────── */

function RowCard({ doc, kind, subtitle, href, canPreview, isVideo, onPreview, labels, className }) {
  return (
    <div
      className={cn(
        "group flex items-center gap-[0.75em] p-[0.625em] rounded-[0.5em] hover:bg-bg-alt",
        "transition-[background-color] duration-150 ease-out",
        className,
      )}
    >
      <DocumentIcon kind={kind} size="sm" />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[0.8125em] font-semibold text-text truncate">
          {doc.title}
        </span>
        {subtitle && (
          <span className="text-[0.6875em] text-text-muted truncate">
            {subtitle}
          </span>
        )}
      </div>
      <div className="flex items-center gap-[0.25em] shrink-0">
        {canPreview && (
          <button
            type="button"
            onClick={() => onPreview(doc)}
            aria-label={isVideo ? (labels.watch ?? "Watch") : (labels.preview ?? "Preview")}
            className="inline-flex items-center justify-center w-[2em] h-[2em] rounded-[0.375em] text-text-muted hover:text-text hover:bg-bg transition-[color,background-color] duration-150 ease-out"
          >
            {isVideo ? (
              <Play className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            ) : (
              <Eye className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            )}
          </button>
        )}
        {href && (
          <a
            href={href}
            target={doc.kind === "url" ? "_blank" : undefined}
            rel={doc.kind === "url" ? "noopener noreferrer" : undefined}
            download={doc.kind === "file" || undefined}
            aria-label={doc.kind === "url" ? (labels.openInNewTab ?? "Open") : (labels.download ?? "Download")}
            className="inline-flex items-center justify-center w-[2em] h-[2em] rounded-[0.375em] text-text-muted hover:text-text hover:bg-bg transition-[color,background-color] duration-150 ease-out"
          >
            {doc.kind === "url" ? (
              <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            ) : (
              <Download className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            )}
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Attachment pill (inline) ────────────────────────────────────────── */

function AttachmentPill({ doc, kind, href, labels, className }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target={doc.kind === "url" ? "_blank" : undefined}
      rel={doc.kind === "url" ? "noopener noreferrer" : undefined}
      download={doc.kind === "file" || undefined}
      className={cn(
        "inline-flex items-center gap-[0.5em] max-w-full px-[0.625em] py-[0.375em] rounded-[0.375em]",
        "bg-bg-alt text-text-secondary hover:text-text hover:bg-surface hover:shadow-xs",
        "transition-[color,background-color,box-shadow] duration-150 ease-out",
        className,
      )}
      title={doc.title}
    >
      <DocumentIcon kind={kind} size="sm" className="w-[1.5em] h-[1.5em] rounded-[0.25em]" />
      <span className="text-[0.75em] font-medium truncate">
        {doc.title || fileNameFromUrl(href)}
      </span>
      {doc.kind === "url" ? (
        <ExternalLink className="w-[0.75em] h-[0.75em] shrink-0" strokeWidth={1.75} />
      ) : (
        <Download className="w-[0.75em] h-[0.75em] shrink-0" strokeWidth={1.75} />
      )}
      <span className="sr-only">
        {doc.kind === "url" ? (labels.openInNewTab ?? "Open") : (labels.download ?? "Download")}
      </span>
    </a>
  );
}
