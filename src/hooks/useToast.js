/**
 * useToast — Toast notification system.
 *
 * Usage:
 *   1. Wrap app in <ToastProvider> (mounted in [locale]/layout.jsx)
 *   2. Call useToast() in any client component to get { toast }
 *   3. toast.success("Message") | toast.error("Message") | toast.warning("...") | toast.info("...")
 *
 * Options:
 *   toast.success(message, { title?, duration?, financial? })
 *   financial: true → toast does NOT auto-dismiss (manual only — design system rule for financial actions)
 *
 * Toast object shape:
 *   { id, tone, title?, message, financial, duration }
 *
 * Tones: "success" | "error" | "warning" | "info"
 */

"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((tone, message, { title, duration = 4000, financial = false } = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, tone, title, message, financial }]);
    if (!financial) {
      timers.current[id] = setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const toast = {
    success: (msg, opts) => add("success", msg, opts),
    error:   (msg, opts) => add("error",   msg, opts),
    warning: (msg, opts) => add("warning", msg, opts),
    info:    (msg, opts) => add("info",    msg, opts),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ── Toast UI ─────────────────────────────────────────────────────────────── */

const TONES = {
  success: { bar: "bg-status-approved-text", icon: "✓", iconColor: "text-status-approved-text", bg: "bg-status-approved-bg", border: "border-status-approved-text/20" },
  error:   { bar: "bg-status-rejected-text", icon: "✕", iconColor: "text-status-rejected-text", bg: "bg-status-rejected-bg", border: "border-status-rejected-text/20" },
  warning: { bar: "bg-status-pending-text",  icon: "!", iconColor: "text-status-pending-text",  bg: "bg-status-pending-bg",  border: "border-status-pending-text/20"  },
  info:    { bar: "bg-accent",               icon: "i", iconColor: "text-accent",               bg: "bg-status-active-bg",   border: "border-accent/20"                },
};

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-[1em] right-[1em] z-[90] flex flex-col gap-[0.5em] w-full max-w-[22em]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const tone = TONES[toast.tone] ?? TONES.info;
  return (
    <div
      className={`flex items-start gap-[0.75em] p-[0.875em] rounded-[0.5em] border shadow-lg ${tone.bg} ${tone.border}`}
      style={{ animation: "fade-up 0.2s ease-out" }}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <span className={`shrink-0 font-bold text-[0.875em] mt-[0.0625em] ${tone.iconColor}`}>
        {tone.icon}
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="text-[0.875em] font-semibold text-text font-body">{toast.title}</p>
        )}
        <p className="text-[0.8125em] text-text-secondary font-body">{toast.message}</p>
        {toast.financial && (
          <p className="text-[0.75em] text-text-muted font-body mt-[0.25em]">Dismiss manually</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-text-muted hover:text-text transition-colors"
      >
        <span className="text-[1em]">×</span>
      </button>
    </div>
  );
}
