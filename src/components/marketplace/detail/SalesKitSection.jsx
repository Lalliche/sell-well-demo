"use client";

/**
 * SalesKitSection — partner-facing "Sales Kit" on /marketplace/[slug].
 *
 * Translates `CampaignDocument` rows into the shape the shared
 * `<DocumentCard />` expects, owns the preview-modal state, and renders
 * the four named slots (with dashed empty-state cards for missing ones)
 * followed by the `other` bucket.
 *
 * Empty-section behavior: when zero documents exist, the whole section
 * is hidden so the page doesn't feel hollow. When at least one slot is
 * filled, the empty-state cards become visible to nudge the company to
 * complete the kit.
 *
 * The section wraps in a Framer Motion variant so the page-level
 * stagger from MarketplaceCampaignDetail propagates here.
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { formatRelative } from "@/lib/format/relative-time";
import { fileNameFromUrl } from "@/lib/format/file";
import {
  DocumentCard,
  DocumentPreviewModal,
  EmptyDocumentSlot,
} from "@/components/shared/data-display/document";

const NAMED_SLOTS = ["pitch_deck", "one_pager", "pricing_sheet", "demo_video_url"];

/** Map slot enum → icon kind for the empty-state card. */
const SLOT_ICON_KIND = {
  pitch_deck:     "pptx",
  one_pager:      "pdf",
  pricing_sheet:  "pdf",
  demo_video_url: "video",
};

export default function SalesKitSection({ documents, variants }) {
  const t = useTranslations("Marketplace.detail.salesKit");
  const tTime = useTranslations("Dashboard.Notifications.Time");
  const [previewing, setPreviewing] = useState(null);

  // Normalize CampaignDocument → DocumentCard's `document` shape and
  // bucket by slot for fixed-order rendering.
  const { byNamedSlot, otherDocs } = useMemo(() => {
    const named = {};
    const other = [];
    for (const d of documents ?? []) {
      const card = toCardDoc(d, tTime);
      if (d.slot === "other") other.push(card);
      else named[d.slot] = card;
    }
    return { byNamedSlot: named, otherDocs: other };
  }, [documents, tTime]);

  // Hide the whole section when the kit is empty — keeps the detail
  // page from feeling sparse on campaigns without any materials.
  const totalDocs = (documents ?? []).length;
  if (totalDocs === 0) return null;

  const previewLabels = {
    preview: t("preview"),
    download: t("download"),
    watch: t("watch"),
    openInNewTab: t("openInNewTab"),
    close: t("close"),
    unpreviewableTitle: t("unpreviewableTitle"),
    unpreviewableBody: t("unpreviewableBody"),
  };

  return (
    <motion.section variants={variants} className="flex flex-col gap-[0.875em]">
      <div className="flex items-baseline justify-between gap-[1em]">
        <h2 className="font-heading text-[1.125em] font-semibold tracking-[-0.01em] text-text">
          {t("title")}
        </h2>
        {/* Future enhancement: "Download all" pill when ≥2 file slots
            are filled. Skipped in this pass — it requires a backend
            zip route. The placeholder lives in 6.3.1 sub-task. */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[0.625em]">
        {NAMED_SLOTS.map((slot) => {
          const doc = byNamedSlot[slot];
          if (doc) {
            return (
              <DocumentCard
                key={slot}
                document={doc}
                variant="grid"
                onPreview={setPreviewing}
                labels={previewLabels}
              />
            );
          }
          return (
            <EmptyDocumentSlot
              key={slot}
              iconKind={SLOT_ICON_KIND[slot]}
              title={t(`slot.${slot}`)}
              subtitle={t(`emptySlot.${slot}`)}
            />
          );
        })}

        {otherDocs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            variant="grid"
            onPreview={setPreviewing}
            labels={previewLabels}
          />
        ))}
      </div>

      <DocumentPreviewModal
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        document={previewing}
        labels={previewLabels}
      />
    </motion.section>
  );
}

/**
 * CampaignDocument → DocumentCard `document` prop. Computed once per
 * row (memoized in the parent). Caller passes a translator scoped to
 * `Dashboard.Notifications.Time.*` for the relative-time formatter.
 */
function toCardDoc(d, tTime) {
  const isVideo = d.slot === "demo_video_url";
  const subtitle = [
    isVideo ? null : fileNameFromUrl(d.file),
    formatRelative(d.updated_at, tTime),
  ].filter(Boolean).join(" · ");

  return {
    id: d.id,
    kind: isVideo ? "url" : "file",
    fileUrl: isVideo ? null : d.file,
    externalUrl: isVideo ? d.url : null,
    title: d.label,
    subtitle,
  };
}
