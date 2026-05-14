"use client";

/**
 * DocumentsSection — files / external links the partner attached to the
 * lead. 5th left-rail section in the LeadDetailOverlay.
 *
 * State machine:
 *   - lead.status === 'draft'  → editable. Add + remove rows allowed,
 *                                "Add document" button surfaces a
 *                                composer.
 *   - lead.status !== 'draft'  → read-only. Documents become a stable
 *                                record once the partner submits — the
 *                                company sees what the partner sent.
 *
 * Reuses the shared `DocumentCard` + `DocumentPreviewModal` primitives
 * (the same surface the marketplace Sales Kit uses), so the visual
 * language stays consistent across the project.
 */

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, FileText, Lock } from "lucide-react";
import {
  DocumentCard,
  DocumentPreviewModal,
} from "@/components/shared/data-display/document";
import { removeLeadDocument } from "@/lib/mock/leads";
import AddDocumentComposer from "./AddDocumentComposer";

export default function DocumentsSection({ lead, t }) {
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [previewing, setPreviewing] = useState(null);
  const isDraft = lead.status === "draft";

  const removeMutation = useMutation({
    mutationFn: removeLeadDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["partner-leads"] }),
  });

  const cards = useMemo(
    () => (lead.documents ?? []).map(toCardDoc),
    [lead.documents],
  );

  const previewLabels = {
    preview: t("documents.preview"),
    download: t("documents.download"),
    watch: t("documents.watch"),
    openInNewTab: t("documents.openInNewTab"),
    close: t("documents.close"),
    unpreviewableTitle: t("documents.unpreviewableTitle"),
    unpreviewableBody: t("documents.unpreviewableBody"),
  };

  return (
    <div className="flex flex-col gap-[0.875em]">
      <Header
        isDraft={isDraft}
        composerOpen={composerOpen}
        onAdd={() => setComposerOpen(true)}
        t={t}
      />

      {cards.length === 0 ? (
        <EmptyHint isDraft={isDraft} t={t} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[0.625em]">
          {cards.map((doc) => (
            <DocumentRow
              key={doc.id}
              doc={doc}
              isDraft={isDraft}
              onPreview={setPreviewing}
              onRemove={() => removeMutation.mutate(doc.id)}
              labels={previewLabels}
              removingId={removeMutation.variables}
              isRemoving={removeMutation.isPending}
              t={t}
            />
          ))}
        </div>
      )}

      {composerOpen && isDraft && (
        <AddDocumentComposer
          lead={lead}
          onClose={() => setComposerOpen(false)}
          t={t}
        />
      )}

      <DocumentPreviewModal
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        document={previewing}
        labels={previewLabels}
      />
    </div>
  );
}

function Header({ isDraft, composerOpen, onAdd, t }) {
  return (
    <div className="flex items-center justify-between gap-[1em]">
      <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {t("documents.label")}
      </span>
      {isDraft ? (
        !composerOpen && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-[0.375em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors"
          >
            <Plus className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
            {t("documents.add")}
          </button>
        )
      ) : (
        <span className="inline-flex items-center gap-[0.375em] text-[0.6875em] font-medium text-text-muted">
          <Lock className="w-[0.75em] h-[0.75em]" strokeWidth={2} />
          {t("documents.lockedAfterSubmit")}
        </span>
      )}
    </div>
  );
}

function EmptyHint({ isDraft, t }) {
  return (
    <div className="flex items-center gap-[0.625em] text-[0.8125em] text-text-muted bg-bg-alt/40 border border-dashed border-border-light rounded-[0.5em] px-[0.875em] py-[0.75em]">
      <FileText className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
      {isDraft ? t("documents.emptyDraft") : t("documents.emptySubmitted")}
    </div>
  );
}

function DocumentRow({ doc, isDraft, onPreview, onRemove, labels, isRemoving, removingId, t }) {
  return (
    <div className="relative group">
      <DocumentCard
        document={doc}
        variant="grid"
        onPreview={onPreview}
        labels={labels}
      />
      {isDraft && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving && removingId === doc.id}
          aria-label={t("documents.remove")}
          className="absolute top-[0.5em] right-[0.5em] inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-[0.375em] bg-surface/0 text-text-muted opacity-0 group-hover:opacity-100 hover:bg-status-rejected-bg hover:text-status-rejected-text transition-[opacity,background-color,color] duration-150 ease-out disabled:opacity-50"
        >
          <Trash2 className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}

/**
 * LeadDocument → DocumentCard `document` shape. Mirrors what
 * SalesKitSection.toCardDoc does for CampaignDocument so the shared
 * DocumentCard primitive stays one schema.
 */
function toCardDoc(d) {
  const isUrl = d.kind === "url";
  return {
    id: d.id,
    kind: isUrl ? "url" : "file",
    fileUrl: isUrl ? null : d.file,
    externalUrl: isUrl ? d.url : null,
    title: d.label,
  };
}
