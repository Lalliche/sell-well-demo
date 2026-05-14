/**
 * FilterBar — Search input + filter chips + optional right slot + filter trigger.
 *
 * Props:
 *   search          string — controlled search value
 *   onSearchChange  (value: string) => void
 *   searchPlaceholder string (default: "Search...")
 *   chips           Array<{ key: string, label: string, count?: number }>
 *   activeChip      string | null — currently active chip key
 *   onChipClick     (key: string) => void
 *   onFilterClick   () => void — opens the FilterPanel overlay
 *   activeFilterCount number — badge count on the filter icon (0 = no badge)
 *   rightSlot       ReactNode — optional right-side content (e.g. a button)
 *   className       string
 *
 * States:
 *   default · search active (shows clear X) · chip selected (accent styling) · with right slot
 */

"use client";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FiSearch, FiX, FiSliders } from "react-icons/fi";

export default function FilterBar({
  search = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  chips = [],
  activeChip = null,
  onChipClick,
  onFilterClick,
  activeFilterCount = 0,
  filterTriggerRef,
  rightSlot,
  className,
}) {
  const tCommon = useTranslations("Common");
  return (
    <div className={cn("flex flex-col gap-[0.75em] sm:flex-row sm:items-center sm:gap-[1em]", className)}>
      {/* Filters button — leftmost so the dropdown anchor is closest to
       *  the page's left edge. Comes before search so users see the
       *  filter affordance first when scanning left-to-right. */}
      {onFilterClick && (
        <div className="shrink-0 relative">
          <button
            ref={filterTriggerRef}
            type="button"
            onClick={onFilterClick}
            aria-label="Open filters"
            className={cn(
              "flex items-center gap-[0.375em] h-[2.375em] px-[0.875em] rounded-[0.5em] border",
              "text-[0.8125em] font-medium font-body transition-[background-color,border-color,color] duration-150",
              "focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(59,110,204,0.15)]",
              activeFilterCount > 0
                ? "bg-accent-light border-accent-border text-accent-text"
                : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text",
            )}
          >
            <FiSliders size="0.875em" strokeWidth={2} />
            <span>{tCommon("filters")}</span>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25em] h-[1.25em] rounded-full text-[0.75em] font-semibold px-[0.25em] bg-accent text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <FiSearch
          size="0.875em"
          className="absolute left-[0.875em] top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn(
            "w-full h-[2.375em] bg-surface border border-border rounded-[0.5em]",
            "pl-[2.25em] pr-[2em] text-[0.875em] text-text font-body",
            "placeholder:text-text-muted",
            "focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(59,110,204,0.15)]",
            "transition-[border-color,box-shadow] duration-150",
          )}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange?.("")}
            className="absolute right-[0.625em] top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
          >
            <FiX size="0.875em" />
          </button>
        )}
      </div>

      {/* Chips */}
      {chips.length > 0 && (
        <div className="flex items-center gap-[0.5em] flex-wrap">
          {chips.map((chip) => {
            const isActive = activeChip === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChipClick?.(chip.key)}
                className={cn(
                  "inline-flex items-center gap-[0.375em] h-[2em] px-[1.125em] rounded-full",
                  "text-[0.8125em] font-medium font-body border transition-colors duration-150",
                  isActive
                    ? "bg-accent-light border-accent-border text-accent-text"
                    : "bg-surface border-border text-text-secondary hover:bg-surface-hover hover:text-text",
                )}
              >
                {chip.label}
                {chip.count !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[1.25em] h-[1.25em] rounded-full text-[0.75em] font-semibold px-[0.25em]",
                      isActive ? "bg-accent text-white" : "bg-bg-alt text-text-muted",
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Right slot */}
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
  );
}
