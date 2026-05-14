"use client";

/**
 * EditSalesKitSection — Sales Kit editor inside the CampaignEditOverlay.
 *
 * Mirrors Step 4 of the wizard 1:1: 4 named slots (Pitch Deck · One-Pager
 * · Pricing Sheet · Demo Video URL) plus a free `other` bucket of up to
 * 10 rows. Slots are optional; each named slot accepts at most one file
 * (or URL for the demo video).
 *
 * Form shape mirrors the wizard's `form.sales_kit`:
 *   { pitch_deck: File|null, one_pager: File|null, pricing_sheet: File|null,
 *     demo_video_url: string, other: [{ id, file: File|null, label: string }] }
 *
 * The CampaignEditOverlay seeds `form.sales_kit` from the persisted
 * `campaign.documents` array on mount.
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { FileInput, TextInput } from "@/components/ui/FormInputs";
import {
  DocumentCard,
  DocumentPreviewModal,
} from "@/components/shared/data-display/document";

let _otherId = 1;
const otherId = () => `other-${_otherId++}`;

const NAMED_SLOTS = ["pitch_deck", "one_pager", "pricing_sheet"];

const SLOT_META = (t) => ({
  pitch_deck:    { label: t("slotPitchDeck"),    helper: t("slotPitchDeckHelper"),    accept: ".pdf,.pptx,.jpg,.jpeg,.png" },
  one_pager:     { label: t("slotOnePager"),     helper: t("slotOnePagerHelper"),     accept: ".pdf,.jpg,.jpeg,.png" },
  pricing_sheet: { label: t("slotPricingSheet"), helper: t("slotPricingSheetHelper"), accept: ".pdf,.pptx,.xlsx" },
  demo_video_url:{ label: t("slotDemoVideo"),    helper: t("slotDemoVideoHelper"),    accept: null },
});

function fileToCardDoc(file, label) {
  if (!file) return null;
  const url = file instanceof File ? URL.createObjectURL(file) : file;
  return { id: label, kind: "file", fileUrl: url, title: label };
}

const validateVideoUrl = (url) =>
  !url || /youtube\.com|youtu\.be|loom\.com|vimeo\.com/.test(url);

export default function EditSalesKitSection({ form, patch }) {
  const t = useTranslations("Campaigns.companyDetail.edit.salesKit");
  const [previewing, setPreviewing] = useState(null);
  const [videoError, setVideoError] = useState(null);

  const kit = form.sales_kit ?? {
    pitch_deck: null,
    one_pager: null,
    pricing_sheet: null,
    demo_video_url: "",
    other: [],
  };

  const setKit = (next) => patch("sales_kit")(next);
  const patchKit = (key) => (val) => setKit({ ...kit, [key]: val });

  const handleVideoUrl = (val) => {
    setVideoError(null);
    if (val && !validateVideoUrl(val)) setVideoError(t("videoUrlError"));
    patchKit("demo_video_url")(val);
  };

  const addOther = () =>
    setKit({ ...kit, other: [...kit.other, { id: otherId(), file: null, label: "" }] });
  const patchOther = (id, key) => (val) =>
    setKit({ ...kit, other: kit.other.map((o) => (o.id === id ? { ...o, [key]: val } : o)) });
  const removeOther = (id) =>
    setKit({ ...kit, other: kit.other.filter((o) => o.id !== id) });

  const meta = SLOT_META(t);
  const previewLabels = {
    preview: t("preview"), download: t("download"), watch: t("watch"),
    openInNewTab: t("openInNewTab"), close: t("close"),
    unpreviewableTitle: t("unpreviewableTitle"), unpreviewableBody: t("unpreviewableBody"),
  };

  return (
    <div className="flex flex-col gap-[1.25em]">
      <p className="text-[0.8125em] text-text-muted leading-[1.55]">{t("intro")}</p>

      {NAMED_SLOTS.map((slot) => (
        <NamedSlot
          key={slot}
          label={meta[slot].label}
          helper={meta[slot].helper}
          accept={meta[slot].accept}
          file={kit[slot]}
          onFile={patchKit(slot)}
          onPreview={setPreviewing}
          previewLabels={previewLabels}
          t={t}
        />
      ))}

      {/* Demo video URL slot */}
      <div className="flex flex-col gap-[0.625em] p-[1em] border border-border-light rounded-[0.625em] bg-surface">
        <div className="flex items-center justify-between gap-[0.5em]">
          <div className="flex flex-col gap-[0.125em]">
            <span className="text-[0.875em] font-semibold text-text">{meta.demo_video_url.label}</span>
            <span className="text-[0.75em] text-text-muted">{meta.demo_video_url.helper}</span>
          </div>
          <OptionalPill t={t} />
        </div>
        <TextInput
          placeholder="https://youtube.com/watch?v=..."
          value={kit.demo_video_url ?? ""}
          onChange={handleVideoUrl}
          type="url"
          errorMessage={videoError}
        />
      </div>

      {/* Other documents bucket — capped at 10 rows */}
      <div className="flex flex-col gap-[0.625em]">
        <span className="text-[0.875em] font-semibold text-text">{t("otherTitle")}</span>
        {kit.other.map((row) => (
          <OtherDocRow
            key={row.id}
            row={row}
            onFile={patchOther(row.id, "file")}
            onLabel={patchOther(row.id, "label")}
            onRemove={() => removeOther(row.id)}
            t={t}
          />
        ))}
        {kit.other.length < 10 && (
          <button
            type="button"
            onClick={addOther}
            className="self-start inline-flex items-center gap-[0.375em] text-[0.8125em] font-semibold text-accent-text hover:text-accent transition-colors duration-150 ease-out"
          >
            <Plus className="w-[1em] h-[1em]" strokeWidth={2} />
            {t("addOther")}
          </button>
        )}
      </div>

      <DocumentPreviewModal
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        document={previewing}
        labels={previewLabels}
      />
    </div>
  );
}

function NamedSlot({ label, helper, accept, file, onFile, onPreview, previewLabels, t }) {
  const cardDoc = file ? fileToCardDoc(file, label) : null;
  return (
    <div className="flex flex-col gap-[0.625em] p-[1em] border border-border-light rounded-[0.625em] bg-surface">
      <div className="flex items-start justify-between gap-[0.5em]">
        <div className="flex flex-col gap-[0.125em]">
          <span className="text-[0.875em] font-semibold text-text">{label}</span>
          <span className="text-[0.75em] text-text-muted">{helper}</span>
        </div>
        <OptionalPill t={t} />
      </div>
      {file ? (
        <div className="relative group">
          <DocumentCard
            document={cardDoc}
            variant="row"
            onPreview={onPreview}
            labels={previewLabels}
          />
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label={t("removeFile")}
            className="absolute right-[0.375em] top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-[0.375em] opacity-0 group-hover:opacity-100 hover:bg-status-rejected-bg hover:text-status-rejected-text text-text-muted transition-[opacity,background-color,color] duration-150"
          >
            <Trash2 className="w-[1em] h-[1em]" strokeWidth={1.75} />
          </button>
        </div>
      ) : (
        <FileInput
          accept={accept}
          maxSizeMb={25}
          value={file}
          onChange={onFile}
          helperText={t("fileHelper")}
        />
      )}
    </div>
  );
}

function OtherDocRow({ row, onFile, onLabel, onRemove, t }) {
  const cardDoc = row.file ? fileToCardDoc(row.file, row.label || t("untitled")) : null;
  return (
    <div className="flex flex-col gap-[0.5em] p-[0.875em] border border-border-light rounded-[0.625em] bg-surface">
      <div className="flex items-center gap-[0.5em]">
        <div className="flex-1">
          <TextInput
            placeholder={t("otherLabelPlaceholder")}
            value={row.label}
            onChange={onLabel}
          />
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={t("removeOther")}
          className="shrink-0 inline-flex items-center justify-center w-[2.5em] h-[2.75em] rounded-[0.5em] text-text-muted hover:bg-status-rejected-bg hover:text-status-rejected-text transition-[background-color,color] duration-150"
        >
          <Trash2 className="w-[1em] h-[1em]" strokeWidth={1.75} />
        </button>
      </div>
      {cardDoc ? (
        <DocumentCard document={cardDoc} variant="row" />
      ) : (
        <FileInput
          accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.zip"
          maxSizeMb={25}
          value={row.file}
          onChange={onFile}
        />
      )}
    </div>
  );
}

function OptionalPill({ t }) {
  return (
    <span className="shrink-0 inline-flex items-center h-[1.375em] px-[0.5em] rounded-full bg-bg-alt text-text-muted text-[0.6875em] font-semibold uppercase tracking-[0.04em]">
      {t("optional")}
    </span>
  );
}
