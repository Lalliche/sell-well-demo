"use client";

/**
 * AddDocumentComposer — inline form to add a single LeadDocument to a
 * draft lead. Two modes: file upload OR external URL. Both modes require
 * a label. Lives next to DocumentsSection.
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Upload, Link2 } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { TextInput, FileInput } from "@/components/ui/FormInputs";
import { useToast } from "@/hooks/useToast";
import { addLeadDocument } from "@/lib/mock/leads";
import { objectUrlFor, isValidUrl, defaultLabelFromFile } from "./file-helpers";

export default function AddDocumentComposer({ lead, onClose, t }) {
  const queryClient = useQueryClient();
  const tCommon = useTranslations("Common");
  const { toast } = useToast();
  const [mode, setMode] = useState("file"); // "file" | "url"
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState(null);

  const mutation = useMutation({
    mutationFn: addLeadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-leads"] });
      onClose?.();
    },
    onError: () => setError(t("documents.errorGeneric")),
  });

  const handleSave = () => {
    setError(null);
    const trimmedLabel = label.trim();
    const fireMissingToast = () =>
      toast.warning(tCommon("formErrorsBody"), { title: tCommon("formErrorsTitle") });
    if (!trimmedLabel) {
      setError(t("documents.errorLabelRequired"));
      fireMissingToast();
      return;
    }
    if (mode === "file") {
      if (!file) {
        setError(t("documents.errorFileRequired"));
        fireMissingToast();
        return;
      }
      mutation.mutate({
        lead_id: lead.id,
        kind: "file",
        file: objectUrlFor(file),
        label: trimmedLabel,
      });
    } else {
      const trimmedUrl = url.trim();
      if (!trimmedUrl || !isValidUrl(trimmedUrl)) {
        setError(t("documents.errorUrlInvalid"));
        fireMissingToast();
        return;
      }
      mutation.mutate({
        lead_id: lead.id,
        kind: "url",
        url: trimmedUrl,
        label: trimmedLabel,
      });
    }
  };

  const handleFileChange = (f) => {
    setFile(f);
    if (f && !label) setLabel(defaultLabelFromFile(f));
  };

  return (
    <div className="flex flex-col gap-[0.75em] rounded-[0.5em] border border-accent/30 bg-surface p-[0.875em] shadow-xs">
      <div className="flex items-center gap-[0.375em] p-[0.25em] bg-bg-alt rounded-[0.5em] self-start">
        <ModeButton active={mode === "file"} onClick={() => setMode("file")} icon={Upload}>
          {t("documents.modeFile")}
        </ModeButton>
        <ModeButton active={mode === "url"} onClick={() => setMode("url")} icon={Link2}>
          {t("documents.modeUrl")}
        </ModeButton>
      </div>

      {mode === "file" ? (
        <FileInput
          label={t("documents.fileLabel")}
          accept=".pdf,.docx,.pptx,.jpg,.jpeg,.png,.zip"
          value={file}
          onChange={handleFileChange}
          maxSizeMb={10}
        />
      ) : (
        <TextInput
          label={t("documents.urlLabel")}
          placeholder={t("documents.urlPlaceholder")}
          value={url}
          onChange={setUrl}
          type="url"
        />
      )}

      <TextInput
        label={t("documents.titleLabel")}
        placeholder={t("documents.titlePlaceholder")}
        value={label}
        onChange={setLabel}
      />

      {error && (
        <p className="text-[0.75em] text-status-rejected-text bg-status-rejected-bg border border-status-rejected-text/20 rounded-[0.375em] px-[0.625em] py-[0.375em]">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-[0.5em]">
        <AppButton variant="ghost" size="sm" onClick={onClose} disabled={mutation.isPending}>
          {t("documents.cancel")}
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          onClick={handleSave}
          isLoading={mutation.isPending}
        >
          {mutation.isPending ? t("documents.saving") : t("documents.save")}
        </AppButton>
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-[0.375em] px-[0.75em] h-[1.875em] rounded-[0.375em] text-[0.75em] font-semibold transition-[background-color,color] duration-150 ease-out " +
        (active ? "bg-surface text-text shadow-xs" : "text-text-muted hover:text-text")
      }
    >
      <Icon className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
      {children}
    </button>
  );
}
