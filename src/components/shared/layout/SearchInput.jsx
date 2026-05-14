"use client";

/**
 * Compact search input shared by /leads (and a candidate to extract to
 * shared/ if a third caller appears). Controlled, with a clear-X
 * affordance when the value is non-empty.
 */

import { FiSearch, FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-0 sm:max-w-[24em]">
      <FiSearch
        size="0.875em"
        className="absolute left-[0.875em] top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full h-[2.375em] bg-surface border border-border rounded-[0.5em]",
          "pl-[2.25em] pr-[2em] text-[0.875em] text-text font-body",
          "placeholder:text-text-muted",
          "focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(59,110,204,0.15)]",
          "transition-[border-color,box-shadow] duration-150",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-[0.625em] top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          aria-label="Clear search"
        >
          <FiX size="0.875em" />
        </button>
      )}
    </div>
  );
}
