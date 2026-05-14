"use client";

/**
 * NoteRow — single row in the vertical timeline-rail. Filled accent dot
 * with halo + connector segment + card on the right with date/time pill
 * and body. Pure presentation.
 */

import { Calendar } from "lucide-react";
import { formatNoteDate, formatNoteTime } from "./note-helpers";

export default function NoteRow({ note, isLast, locale }) {
  return (
    <li className="relative flex gap-[0.875em] pb-[1em] last:pb-0">
      <div className="flex flex-col items-center shrink-0 pt-[0.375em]">
        <span
          className="w-[0.625em] h-[0.625em] rounded-full bg-accent shadow-[0_0_0_3px_var(--color-accent-light,rgba(59,110,204,0.12))]"
          aria-hidden
        />
        {!isLast && <span className="flex-1 w-px bg-border-light mt-[0.25em]" />}
      </div>

      <div className="flex-1 min-w-0 rounded-[0.5em] border border-border-light bg-surface px-[0.875em] py-[0.75em] flex flex-col gap-[0.375em]">
        <div className="flex items-center gap-[0.5em] flex-wrap">
          <span className="inline-flex items-center gap-[0.3125em] text-[0.6875em] font-semibold text-accent-text bg-accent/10 px-[0.5em] h-[1.5em] rounded-full font-mono tabular-nums">
            <Calendar className="w-[0.75em] h-[0.75em]" strokeWidth={2} />
            {formatNoteDate(note.created_at, locale)}
          </span>
          <span className="text-[0.6875em] font-mono tabular-nums text-text-muted">
            {formatNoteTime(note.created_at, locale)}
          </span>
        </div>
        <p className="text-[0.8125em] text-text leading-[1.55] whitespace-pre-line">
          {note.body}
        </p>
      </div>
    </li>
  );
}
