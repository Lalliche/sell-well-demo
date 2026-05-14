"use client";

/**
 * NoteComposer — textarea + optional inline date/time picker. The picker
 * starts collapsed behind a "Set custom date & time" link. When closed,
 * the saved note's `created_at` is omitted (server stamps now). When
 * open, the partner picks a date + 24h time and we ISO-format locally.
 */

import { Calendar, X } from "lucide-react";
import AppButton from "@/components/ui/Buttons";
import { TextArea, DateInput } from "@/components/ui/FormInputs";
import { nowYMD, nowHM } from "./note-helpers";

export default function NoteComposer({
  draft, setDraft,
  customDateOn, setCustomDateOn,
  customYMD, setCustomYMD,
  customHM, setCustomHM,
  isPending, onSave, onCancel, t,
}) {
  return (
    <div className="flex flex-col gap-[0.625em] rounded-[0.5em] border border-accent/30 bg-surface p-[0.875em] shadow-xs">
      <TextArea
        label={t("notes.composeLabel")}
        placeholder={t("notes.composePlaceholder")}
        value={draft}
        onChange={setDraft}
        rows={3}
        maxLength={2000}
      />

      {!customDateOn ? (
        <button
          type="button"
          onClick={() => setCustomDateOn(true)}
          className="self-start inline-flex items-center gap-[0.375em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors"
        >
          <Calendar className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
          {t("notes.setCustomDate")}
        </button>
      ) : (
        <div className="flex items-end gap-[0.625em] flex-wrap bg-bg-alt/40 border border-border-light rounded-[0.5em] p-[0.625em]">
          <div className="flex-1 min-w-[10em]">
            <DateInput
              label={t("notes.dateLabel")}
              value={customYMD}
              onChange={setCustomYMD}
              maxDate={nowYMD()}
            />
          </div>
          <div className="flex flex-col gap-[0.25em] w-[7em]">
            <label className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
              {t("notes.timeLabel")}
            </label>
            <input
              type="time"
              value={customHM}
              onChange={(e) => setCustomHM(e.target.value)}
              className="h-[2.75em] px-[0.625em] rounded-[0.5em] border border-border bg-surface text-[0.8125em] font-mono tabular-nums text-text focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/20 transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomDateOn(false);
              setCustomYMD(nowYMD());
              setCustomHM(nowHM());
            }}
            className="inline-flex items-center gap-[0.25em] h-[2.75em] px-[0.5em] text-[0.6875em] font-semibold text-text-muted hover:text-text transition-colors"
            aria-label={t("notes.clearCustomDate")}
          >
            <X className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
            {t("notes.useNow")}
          </button>
        </div>
      )}

      <div className="flex items-center justify-end gap-[0.5em]">
        <AppButton variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          {t("notes.cancel")}
        </AppButton>
        <AppButton
          variant="primary"
          size="sm"
          onClick={onSave}
          isLoading={isPending}
          disabled={!draft.trim()}
        >
          {isPending ? t("notes.saving") : t("notes.save")}
        </AppButton>
      </div>
    </div>
  );
}
