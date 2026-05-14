"use client";

/**
 * RoleSwitcher — dev-only floating pill in the bottom-right of the screen.
 * Lets you swap between mock users without re-logging.
 *
 * Hard-gated on `process.env.NODE_ENV === "production"` — returns null in
 * production so it never ships.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronUp, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { MOCK_USERS } from "@/lib/mock/_seed/users";
import { MOCK_PARTNER_PROFILES } from "@/lib/mock/_seed/partner-profiles";
import { MOCK_COMPANY_PROFILES } from "@/lib/mock/_seed/company-profiles";
import { cn } from "@/lib/utils";

const ROLE_LABEL = {
  sales_partner: "Partner",
  company:       "Company",
  admin:         "Admin",
};

const STATUS_DOT = {
  approved:            "bg-[var(--color-status-approved-text)]",
  pending_review:      "bg-[var(--color-status-pending-text)]",
  more_info_requested: "bg-[var(--color-status-pending-text)]",
  rejected:            "bg-[var(--color-status-rejected-text)]",
};

function displayNameFor(user) {
  if (user.role === "sales_partner") {
    const p = MOCK_PARTNER_PROFILES.find((x) => x.user === user.id);
    return p ? `${p.first_name} ${p.last_name}` : user.email;
  }
  if (user.role === "company") {
    const c = MOCK_COMPANY_PROFILES.find((x) => x.user === user.id);
    return c ? c.company_name : user.email;
  }
  return "Admin";
}

export default function RoleSwitcher() {
  if (process.env.NODE_ENV === "production") return null;

  const { user, loginAsUserId, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const currentLabel = user
    ? `${ROLE_LABEL[user.role]} · ${displayNameFor(user)}`
    : "Logged out";

  return (
    <div className="fixed bottom-[1em] right-[1em] z-[100]">
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-[2.875em] right-0 w-[20em] bg-surface border border-border rounded-[0.625em] shadow-xl overflow-hidden"
          >
            <div className="px-[1em] py-[0.625em] border-b border-border-light bg-bg-alt">
              <p className="text-[0.6875em] uppercase tracking-[0.06em] font-semibold text-text-muted">
                Dev role switcher
              </p>
              <p className="text-[0.75em] text-text-secondary mt-[0.125em]">
                Swap mock user. Persists to localStorage.
              </p>
            </div>
            <div className="max-h-[24em] overflow-y-auto">
              {MOCK_USERS.map((u) => {
                const isCurrent = user?.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      loginAsUserId(u.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-[0.625em] px-[1em] py-[0.625em] text-left",
                      "transition-colors duration-100",
                      isCurrent ? "bg-accent-light" : "hover:bg-surface-hover",
                    )}
                  >
                    <span className={cn("shrink-0 w-[0.5em] h-[0.5em] rounded-full", STATUS_DOT[u.application_status] ?? "bg-text-muted")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8125em] font-medium text-text truncate">
                        {displayNameFor(u)}
                      </p>
                      <p className="text-[0.6875em] text-text-muted font-mono truncate">
                        {u.email} · {ROLE_LABEL[u.role]} · {u.application_status}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="shrink-0 text-[0.6875em] font-semibold text-accent uppercase tracking-[0.06em]">
                        active
                      </span>
                    )}
                  </button>
                );
              })}
              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-[0.625em] px-[1em] py-[0.625em] text-left border-t border-border-light hover:bg-surface-hover transition-colors duration-100"
                >
                  <LogOut size="0.875em" strokeWidth={1.75} className="text-text-muted shrink-0" />
                  <span className="text-[0.8125em] text-text-secondary">Log out</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-[0.5em] h-[2.375em] px-[0.875em] rounded-full",
          "bg-text text-white font-medium text-[0.75em]",
          "transition-[transform,box-shadow] duration-150 ease-out",
          "hover:-translate-y-[1px] shadow-md hover:shadow-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        )}
      >
        <UserIcon size="0.875em" strokeWidth={2} />
        <span className="font-mono tracking-[0.02em] truncate max-w-[14em]">
          {currentLabel}
        </span>
        <ChevronUp
          size="0.875em"
          strokeWidth={2}
          className={cn("transition-transform duration-150", open && "rotate-180")}
        />
      </button>
    </div>
  );
}
