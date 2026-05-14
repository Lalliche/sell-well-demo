"use client";

/**
 * LeadNotesSplit — company-side replacement for the single
 * `NotesTimeline`. Renders **two stacked timelines**:
 *
 *   1. "From the partner" — partner-authored notes, read-only for the
 *      company. The partner's record of conversations, demos, and
 *      objections that came WITH the lead. Locked behind reservation
 *      (the parent overlay decides whether to mount this at all).
 *   2. "Your notes" — company-authored notes, with an inline composer.
 *      Their internal CRM trail. Only the company can post here.
 *
 * Reuses `NoteRow` + `NoteComposer` primitives unchanged. Mutations
 * post via `addCompanyLeadNote` and invalidate `["company-leads"]`.
 *
 * The note's `author` field arrives on every row from the mock layer
 * (and from the future serializer). Notes seeded before this field
 * landed default to "partner".
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Users, Building2 } from "lucide-react";
import { addCompanyLeadNote } from "@/lib/mock/leads";
import NoteRow from "./notes/NoteRow";
import NoteComposer from "./notes/NoteComposer";
import { nowYMD, nowHM, toIso } from "./notes/note-helpers";

export default function LeadNotesSplit({ lead, locale, t }) {
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [customDateOn, setCustomDateOn] = useState(false);
  const [customYMD, setCustomYMD] = useState(nowYMD());
  const [customHM, setCustomHM] = useState(nowHM());

  const mutation = useMutation({
    mutationFn: addCompanyLeadNote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-leads"] });
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
      // Custom dates are intentionally NOT exposed to the company-side
      // composer in v1 — companies should be writing internal notes in
      // real time, not back-dating. Keeping the prop wired anyway in
      // case product asks for it later.
    });
  };

  // Split the rows by author. The mock returns every note for the lead;
  // the UI is responsible for the visual separation.
  const allNotes = Array.isArray(lead.notes) ? lead.notes : [];
  const partnerNotes = [...allNotes]
    .filter((n) => n.author === "partner")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const companyNotes = [...allNotes]
    .filter((n) => n.author === "company")
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="flex flex-col gap-[1.5em]">
      {/* Partner timeline — read-only */}
      <section className="flex flex-col gap-[0.625em]">
        <div className="flex items-center gap-[0.5em]">
          <Users className="w-[0.875em] h-[0.875em] text-text-muted" strokeWidth={1.75} />
          <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
            {t("notesSplit.fromPartner")}
          </span>
        </div>
        {partnerNotes.length === 0 ? (
          <div className="flex items-center gap-[0.625em] text-[0.8125em] text-text-muted bg-bg-alt/40 border border-dashed border-border-light rounded-[0.5em] px-[0.875em] py-[0.75em]">
            <MessageSquare className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            {t("notesSplit.partnerEmpty")}
          </div>
        ) : (
          <ol className="relative flex flex-col">
            {partnerNotes.map((n, i) => (
              <NoteRow
                key={n.id}
                note={n}
                isLast={i === partnerNotes.length - 1}
                locale={locale}
              />
            ))}
          </ol>
        )}
      </section>

      {/* Company timeline — editable */}
      <section className="flex flex-col gap-[0.625em] pt-[1.25em] border-t border-border-light">
        <div className="flex items-center justify-between gap-[1em]">
          <div className="flex items-center gap-[0.5em]">
            <Building2 className="w-[0.875em] h-[0.875em] text-accent" strokeWidth={1.75} />
            <span className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-accent-text">
              {t("notesSplit.yourNotes")}
            </span>
          </div>
          {!composerOpen && (
            <button
              type="button"
              onClick={() => setComposerOpen(true)}
              className="inline-flex items-center gap-[0.375em] text-[0.75em] font-semibold text-accent-text hover:text-accent transition-colors duration-150"
            >
              <Plus className="w-[0.875em] h-[0.875em]" strokeWidth={2} />
              {t("notesSplit.addYourNote")}
            </button>
          )}
        </div>

        {companyNotes.length === 0 ? (
          <div className="flex items-center gap-[0.625em] text-[0.8125em] text-text-muted bg-bg-alt/40 border border-dashed border-border-light rounded-[0.5em] px-[0.875em] py-[0.75em]">
            <MessageSquare className="w-[0.875em] h-[0.875em]" strokeWidth={1.75} />
            {t("notesSplit.companyEmpty")}
          </div>
        ) : (
          <ol className="relative flex flex-col">
            {companyNotes.map((n, i) => (
              <NoteRow
                key={n.id}
                note={n}
                isLast={i === companyNotes.length - 1}
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
      </section>
    </div>
  );
}
