"use client";

/**
 * NotesTimeline — append-only vertical timeline of `LeadNote` rows.
 *
 * Visual: left accent rail with a dot per note + connector segment,
 * card on the right with date/time pill + body. Pattern adapted from
 * Salesforce / Pipedrive activity feeds.
 *
 * Composer: textarea + "Set custom date & time" inline toggle. When the
 * partner doesn't pick anything, we save with `created_at` omitted and
 * the server stamps now.
 *
 * Mirrors the data-model-spec.md `LeadNote` model (append-only — no
 * edit, no delete in V1).
 *
 * Composition lives in `notes/`:
 *   - NoteRow         → single rail-and-card row
 *   - NoteComposer    → textarea + optional date/time picker
 *   - note-helpers.js → pure formatting + time helpers
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare } from "lucide-react";
import { addLeadNote } from "@/lib/mock/leads";
import NoteRow from "./notes/NoteRow";
import NoteComposer from "./notes/NoteComposer";
import { nowYMD, nowHM, toIso } from "./notes/note-helpers";

export default function NotesTimeline({ lead, locale, t }) {
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [customDateOn, setCustomDateOn] = useState(false);
  const [customYMD, setCustomYMD] = useState(nowYMD());
  const [customHM, setCustomHM] = useState(nowHM());

  const mutation = useMutation({
    mutationFn: addLeadNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-leads"] });
      reset();
    },
  });

  const reset = () => {
    setDraft("");
    setCustomDateOn(false);
    setCustomYMD(nowYMD());
    setCustomHM(nowHM());
    setComposerOpen(false);
  };

  const handleAdd = () => {
    if (!draft.trim()) return;
    mutation.mutate({
      lead_id: lead.id,
      body: draft,
      created_at: customDateOn ? toIso(customYMD, customHM) : undefined,
    });
  };

  // Newest first inside the timeline rail (most recent context at the top).
  const notes = Array.isArray(lead.notes)
    ? [...lead.notes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    : [];

  return (
    <div className="flex flex-col gap-[0.875em]">
      <div className="flex items-center justify-between gap-[1em]">
        <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
          {t("notes.label")}
        </span>
        {!composerOpen && (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-[0.375em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors"
          >
            <Plus className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
            {t("notes.add")}
          </button>
        )}
      </div>

      {notes.length === 0 ? (
        <div className="flex items-center gap-[0.625em] text-[0.8125em] text-text-muted bg-bg-alt/40 border border-dashed border-border-light rounded-[0.5em] px-[0.875em] py-[0.75em]">
          <MessageSquare className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
          {t("notes.empty")}
        </div>
      ) : (
        <ol className="relative flex flex-col">
          {notes.map((n, i) => (
            <NoteRow
              key={n.id}
              note={n}
              isLast={i === notes.length - 1}
              locale={locale}
            />
          ))}
        </ol>
      )}

      {composerOpen && (
        <NoteComposer
          draft={draft}
          setDraft={setDraft}
          customDateOn={customDateOn}
          setCustomDateOn={setCustomDateOn}
          customYMD={customYMD}
          setCustomYMD={setCustomYMD}
          customHM={customHM}
          setCustomHM={setCustomHM}
          isPending={mutation.isPending}
          onSave={handleAdd}
          onCancel={reset}
          t={t}
        />
      )}
    </div>
  );
}
