/**
 * DataTable — Sortable, paginated data table with loading and empty states.
 *
 * Props:
 *   columns       Array<{
 *                   key: string,
 *                   label: string,
 *                   render?: (value, row) => ReactNode,
 *                   sortable?: boolean,
 *                   align?: "left" | "center" | "right",
 *                   width?: string — CSS width e.g. "10em", "20%"
 *                 }>
 *   rows          Array<object>
 *   getRowId      (row) => string | number  (default: row.id)
 *   isLoading     boolean
 *   skeletonRows  number (default: 5)
 *   emptyTitle    string
 *   emptySubtitle string
 *   emptyAction   ReactNode
 *   actions       (row) => ReactNode — right-aligned actions column
 *   actionsWidth  string — CSS width for the actions column (default: "7em").
 *                  Bump this when rendering multiple buttons per row.
 *   onRowClick    (row) => void — when provided, rows become clickable
 *                  (cursor pointer, hover bg). Action cells inside
 *                  `actions` should call e.stopPropagation() if they
 *                  don't want the row click to fire too.
 *   pageSize      number (default: 10)
 *   className     string
 *
 * Layout: `table-fixed` is enabled so column `width` declarations are
 * authoritative — content cannot blow them out. Cells truncate inside
 * a `<div className="truncate">` wrapper, so callers don't need to worry
 * about a single long string blowing the row wider than the container.
 *
 * Page transitions: rows fade out first, then new rows fade in.
 * Height shrinks smoothly because the fade-out gives the browser
 * time to paint before the layout collapses.
 */

"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { FiChevronUp, FiChevronDown } from "react-icons/fi";
import { SkeletonTableRows } from "./Skeleton";
import EmptyState from "@/components/shared/feedback/EmptyState";

const PAGE_SIZES = [5, 10, 20, 50];

/* ── Custom page-size picker ─────────────────────────────────────────────── */
function PageSizePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) close(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  return (
    <div className="relative flex items-center gap-[0.375em]" ref={ref}>
      <span className="text-[0.8125em] text-text-muted font-body">Rows:</span>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-[0.25em] h-[1.75em] px-[0.5em]",
          "bg-surface border border-border rounded-[0.375em]",
          "text-[0.8125em] font-medium text-text font-body",
          "hover:border-accent transition-colors duration-100",
          open && "border-accent shadow-[0_0_0_2px_rgba(59,110,204,0.15)]",
        )}
      >
        {value}
        <FiChevronDown
          size="0.75em"
          className={cn("text-text-muted transition-transform duration-150", open && "rotate-180")}
        />
      </button>
      {open && (
        <div
          className="absolute bottom-full left-0 mb-[0.25em] bg-surface border border-border rounded-[0.5em] shadow-md z-50 py-[0.25em] min-w-[4em]"
          style={{ animation: "scale-in 0.1s ease-out" }}
        >
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onChange(s); close(); }}
              className={cn(
                "w-full px-[0.75em] py-[0.375em] text-left text-[0.8125em] font-body",
                "hover:bg-surface-hover transition-colors duration-100",
                s === value && "text-accent font-semibold",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Pagination bar ──────────────────────────────────────────────────────── */
function Pagination({ page, totalPages, total, pageSize, onPageSizeChange, onChange }) {
  const from = Math.min((page - 1) * pageSize + 1, total);
  const to   = Math.min(page * pageSize, total);

  const pageNums = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set    = new Set([1, page - 1, page, page + 1, totalPages].filter(p => p >= 1 && p <= totalPages));
    const sorted = [...set].sort((a, b) => a - b);
    const result = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push("…");
      result.push(p);
    });
    return result;
  }, [page, totalPages]);

  return (
    <div className="flex items-center justify-between px-[1.25em] py-[0.75em] border-t border-border-light">
      <div className="flex items-center gap-[1em]">
        <span className="text-[0.8125em] text-text-muted font-body tabular-nums">
          {from}–{to} of {total}
        </span>
        <PageSizePicker value={pageSize} onChange={onPageSizeChange} />
      </div>
      <div className="flex items-center gap-[0.25em]">
        <PageBtn onClick={() => onChange(page - 1)} disabled={page <= 1}>‹</PageBtn>
        {pageNums.map((p, i) =>
          p === "…"
            ? <span key={`e${i}`} className="w-[1.75em] text-center text-text-muted text-[0.875em]">…</span>
            : <PageBtn key={p} onClick={() => onChange(p)} active={p === page}>{p}</PageBtn>
        )}
        <PageBtn onClick={() => onChange(page + 1)} disabled={page >= totalPages}>›</PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ onClick, disabled, active, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center w-[1.75em] h-[1.75em] rounded-[0.375em]",
        "text-[0.8125em] font-medium font-body transition-colors duration-100",
        active   && "bg-accent text-white",
        !active  && "text-text-secondary hover:bg-surface-hover hover:text-text",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}

/* ── DataTable ───────────────────────────────────────────────────────────── */
export default function DataTable({
  columns = [],
  rows = [],
  getRowId = (row) => row.id,
  isLoading = false,
  skeletonRows = 5,
  emptyTitle = "No data",
  emptySubtitle,
  emptyAction,
  actions,
  actionsWidth = "7em",
  onRowClick,
  pageSize: initialPageSize = 10,
  className,
}) {
  const [sortKey,  setSortKey]  = useState(null);
  const [sortDir,  setSortDir]  = useState("asc");
  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [opacity,  setOpacity]  = useState(1);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  // Fade out → change page → fade in. The fade-out gives the browser
  // a rendered frame at low opacity before height collapses, so the
  // height change is never perceived as a sudden jump.
  const changePage = (next) => {
    if (next === page) return;
    setOpacity(0);
    setTimeout(() => {
      setPage(next);
      setOpacity(1);
    }, 180);
  };

  const changePageSize = (s) => { setPageSize(s); setPage(1); };

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated   = sorted.slice((page - 1) * pageSize, page * pageSize);
  const showActions = Boolean(actions);
  const allCols     = showActions ? [...columns, { key: "__actions__", label: "" }] : columns;

  return (
    <div className={cn("bg-surface border border-border-light rounded-[0.625em] shadow-xs overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            {allCols.map((col) => (
              <col
                key={col.key}
                style={{ width: col.width ?? (col.key === "__actions__" ? actionsWidth : "auto") }}
              />
            ))}
          </colgroup>

          <thead>
            <tr className="bg-bg border-b border-border-light">
              {allCols.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-[1.25em] py-[0.75em] text-left whitespace-nowrap",
                    "text-[0.6875em] font-semibold uppercase tracking-[0.06em] text-text-muted font-body",
                    col.align === "right"  && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable && "cursor-pointer select-none hover:text-text",
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-[0.25em]">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      sortDir === "asc"
                        ? <FiChevronUp size="0.875em" />
                        : <FiChevronDown size="0.875em" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody
            style={{
              opacity,
              transition: opacity === 0
                ? "opacity 0.18s ease"          // fade out fast
                : "opacity 0.22s ease 0.05s",   // fade in slightly delayed
            }}
          >
            {isLoading ? (
              <SkeletonTableRows rows={skeletonRows} cols={allCols.length} />
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={allCols.length}>
                  <EmptyState title={emptyTitle} subtitle={emptySubtitle} action={emptyAction} />
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={getRowId(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border-light last:border-0 hover:bg-surface-hover transition-colors duration-100",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        "px-[1.25em] py-[0.875em] text-[0.875em] text-text-secondary font-body",
                        col.align === "right"  && "text-right",
                        col.align === "center" && "text-center",
                      )}
                    >
                      <div className="truncate">
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </div>
                    </td>
                  ))}
                  {showActions && (
                    <td className="px-[1.25em] py-[0.875em]">
                      <div className="flex items-center justify-end gap-[0.5em]">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={sorted.length}
          pageSize={pageSize}
          onPageSizeChange={changePageSize}
          onChange={changePage}
        />
      )}
    </div>
  );
}
