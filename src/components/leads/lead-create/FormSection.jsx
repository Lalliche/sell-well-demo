"use client";

/** Small overlined section wrapper for the lead-create form. */
export default function FormSection({ title, children }) {
  return (
    <section className="flex flex-col gap-[1em]">
      <h2 className="text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-[1em]">{children}</div>
    </section>
  );
}
