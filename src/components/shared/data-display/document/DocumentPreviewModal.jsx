"use client";

/**
 * DocumentPreviewModal — generic in-app preview for any document we can
 * embed. Three behaviors based on the document's inferred kind:
 *
 *   pdf            → <iframe src={fileUrl} /> taking the modal body
 *   video (URL)    → <iframe src={toEmbedUrl(externalUrl)} /> in 16:9
 *   image          → <Image fill /> in a contained frame
 *   anything else  → fallback message + "Open in new tab" + "Download"
 *
 * Lives in shared/data-display/document/ so any surface can mount it
 * without rebuilding the modal chrome. Backdrop blur + escape-to-close
 * + click-outside-to-close handled here once.
 *
 * Animation pattern matches the project's other overlays — backdrop
 * fade + content fade-up, transform/opacity only. Mount-on-open with
 * an exit animation handled by AnimatePresence at the call site (the
 * caller flips `open` and unmounts the modal when the exit completes).
 */

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { X, ExternalLink, Download } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { cn } from "@/lib/utils";
import { inferFileKind, toEmbedUrl, fileNameFromUrl } from "@/lib/format/file";

const BODY_LOCK_CLASS = "overflow-hidden";

export default function DocumentPreviewModal({
  open,
  onClose,
  document: doc,
  // Localized labels — caller passes them in so the modal stays
  // i18n-agnostic and reusable across feature scopes.
  labels = {},
}) {
  // Lock body scroll while the modal is open. Standard pattern; the
  // cleanup runs before the component unmounts.
  useEffect(() => {
    if (!open) return;
    document.body.classList.add(BODY_LOCK_CLASS);
    return () => document.body.classList.remove(BODY_LOCK_CLASS);
  }, [open]);

  // Escape-to-close. Listener attached only while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && doc && (
        <motion.div
          key="document-preview-backdrop"
          className="fixed inset-0 z-[80] flex items-center justify-center p-[1em]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          style={{
            backgroundColor: "rgba(26,26,26,0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
          <motion.div
            key="document-preview-content"
            initial={{ opacity: 0, y: 8, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="relative flex flex-col w-full max-w-[52em] h-[88vh] max-h-[88vh] bg-surface rounded-[0.75em] shadow-xl overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={doc.title ?? labels.previewLabel}
          >
            <PreviewHeader doc={doc} labels={labels} onClose={onClose} />
            <PreviewBody doc={doc} labels={labels} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PreviewHeader({ doc, labels, onClose }) {
  const downloadHref = doc.kind === "url" ? doc.externalUrl : doc.fileUrl;
  return (
    <header className="flex items-center gap-[0.75em] px-[1.25em] py-[0.875em] border-b border-border-light shrink-0">
      <div className="flex flex-col flex-1 min-w-0 gap-[0.0625em]">
        <span className="text-[0.9375em] font-semibold text-text truncate">
          {doc.title}
        </span>
        {doc.subtitle && (
          <span className="text-[0.75em] text-text-muted truncate">
            {doc.subtitle}
          </span>
        )}
      </div>
      {downloadHref && (
        <a
          href={downloadHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[0.375em] text-[0.8125em] font-medium text-text-secondary hover:text-text px-[0.625em] py-[0.375em] rounded-[0.375em] hover:bg-bg-alt transition-[color,background-color] duration-150 ease-out"
        >
          <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          <span className="hidden sm:inline">{labels.openInNewTab ?? "Open"}</span>
        </a>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={labels.close ?? "Close"}
        className="inline-flex items-center justify-center w-[2em] h-[2em] rounded-[0.375em] text-text-muted hover:text-text hover:bg-bg-alt transition-[color,background-color] duration-150 ease-out"
      >
        <X className="w-[1em] h-[1em]" strokeWidth={1.75} />
      </button>
    </header>
  );
}

function PreviewBody({ doc, labels }) {
  const inferred = inferFileKind({
    kind: doc.kind,
    fileUrl: doc.fileUrl,
    externalUrl: doc.externalUrl,
  });

  // PDF inline.
  // No `sandbox` attribute — Chrome's built-in PDF viewer needs full
  // origin access to render. The PDF source is always one of: a URL we
  // own (uploaded by a verified company) or a trusted external URL.
  // Modern browsers' PDF viewers can't execute arbitrary scripts.
  if (inferred === "pdf" && doc.fileUrl) {
    return (
      <div className="flex-1 min-h-0 bg-bg-alt">
        <iframe
          src={`${doc.fileUrl}#toolbar=1&navpanes=0`}
          title={doc.title}
          className="w-full h-full block"
        />
      </div>
    );
  }

  // Video — YouTube / Loom / Vimeo
  if (inferred === "video" && doc.externalUrl) {
    const embed = toEmbedUrl(doc.externalUrl);
    if (embed) {
      return (
        <div className="flex-1 min-h-0 bg-text flex items-center justify-center">
          <div className="w-full aspect-video max-h-full">
            <iframe
              src={embed}
              title={doc.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      );
    }
    return <UnpreviewableFallback doc={doc} labels={labels} />;
  }

  // Inline image
  if (inferred === "image" && doc.fileUrl) {
    return (
      <div className="flex-1 min-h-0 bg-bg-alt flex items-center justify-center">
        <div className="relative w-full h-full">
          <Image
            src={doc.fileUrl}
            alt={doc.title}
            fill
            sizes="60em"
            className="object-contain"
          />
        </div>
      </div>
    );
  }

  return <UnpreviewableFallback doc={doc} labels={labels} />;
}

function UnpreviewableFallback({ doc, labels }) {
  const href = doc.kind === "url" ? doc.externalUrl : doc.fileUrl;
  const filename = fileNameFromUrl(href);
  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-[0.875em] p-[2em] text-center bg-bg-alt">
      <span className="text-[0.9375em] font-semibold text-text">
        {labels.unpreviewableTitle ?? "Preview not available"}
      </span>
      <span className="text-[0.8125em] text-text-secondary max-w-[28em] leading-[1.55]">
        {labels.unpreviewableBody ??
          "This file type can't be previewed in the browser. Open it in a new tab or download to view."}
      </span>
      {filename && (
        <span className="font-mono text-[0.75em] text-text-muted truncate max-w-full">
          {filename}
        </span>
      )}
      {href && (
        <div className="flex items-center gap-[0.5em] pt-[0.25em]">
          <a href={href} target="_blank" rel="noopener noreferrer">
            <AppButton variant="secondary" size="sm">
              <span className="inline-flex items-center gap-[0.375em]">
                <ExternalLink className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
                {labels.openInNewTab ?? "Open in new tab"}
              </span>
            </AppButton>
          </a>
          {doc.kind === "file" && (
            <a href={href} download>
              <AppButton variant="primary" size="sm">
                <span className="inline-flex items-center gap-[0.375em]">
                  <Download className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
                  {labels.download ?? "Download"}
                </span>
              </AppButton>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
