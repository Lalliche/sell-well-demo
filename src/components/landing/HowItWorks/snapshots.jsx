import {
  Building2, BadgeCheck, Lock, Phone, Globe, CheckCircle2,
} from "lucide-react";

/* Snapshot artifacts shown both in collapsed cards and in the expanded
 * detail. Each is a tiny static UI mock — campaign card / application /
 * lead-with-reservation / confirmed-sale ledger. Numbers come from the
 * escrow-leads-spec.md example (100k DA sale → 10k commission + 10k fee). */

function ListSnapshot() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex items-center gap-[0.4375em] bg-bg-alt/60 rounded-[0.375em] p-[0.4375em]">
        <div className="w-[1.5em] h-[1.5em] rounded-[0.3125em] bg-(--accent-light) text-accent flex items-center justify-center shrink-0">
          <Building2 size={11} strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-heading text-[0.625em] font-bold text-text truncate">Atlas CRM</div>
          <div className="font-body text-[0.5em] text-text-muted">B2B SaaS</div>
        </div>
        <span className="font-mono text-[0.625em] font-semibold text-accent">10%</span>
      </div>

      <div className="flex items-center gap-[0.4375em] bg-bg-alt/60 rounded-[0.375em] p-[0.4375em]">
        <div className="w-[1.5em] h-[1.5em] rounded-full bg-(--accent-light) text-accent flex items-center justify-center font-heading text-[0.4375em] font-bold shrink-0">
          AB
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body text-[0.625em] font-semibold text-text truncate">Ahmed Benali</div>
          <div className="font-body text-[0.5em] text-text-muted">B2B SaaS · 6y</div>
        </div>
        <div className="flex items-center gap-[0.1875em]">
          <Phone size={9} strokeWidth={1.75} className="text-text-muted" />
          <Globe size={9} strokeWidth={1.75} className="text-text-muted" />
        </div>
      </div>

      <div className="flex flex-wrap gap-[0.25em] pt-[0.125em]">
        <span className="font-body text-[0.5em] font-medium px-[0.5em] py-[0.125em] rounded-full bg-bg-alt text-text-secondary border border-border-light">Free to list</span>
        <span className="font-body text-[0.5em] font-medium px-[0.5em] py-[0.125em] rounded-full bg-bg-alt text-text-secondary border border-border-light">Free to join</span>
      </div>
    </div>
  );
}

function MatchSnapshot() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex items-center gap-[0.4375em]">
        <div className="w-[1.5em] h-[1.5em] rounded-full bg-(--accent-light) text-accent flex items-center justify-center font-heading text-[0.4375em] font-bold shrink-0">
          AB
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-body text-[0.625em] font-semibold text-text truncate">Ahmed Benali</div>
          <div className="font-body text-[0.5em] text-text-muted">Application · 2h ago</div>
        </div>
      </div>

      <div className="bg-bg-alt/60 rounded-[0.375em] p-[0.4375em] font-body text-[0.5625em] leading-[1.4] text-text-secondary italic">
        “6 yrs selling B2B SaaS. I'll target logistics SMBs in Algiers and Blida via LinkedIn + WhatsApp...”
      </div>

      <div className="flex items-center justify-between pt-[0.125em]">
        <span className="font-mono text-[0.5em] text-text-muted">5 of 12 reviewed</span>
        <div className="flex items-center gap-[0.25em]">
          <span className="font-body text-[0.5em] font-medium px-[0.5em] py-[0.1875em] rounded-[0.25em] bg-status-rejected-bg text-status-rejected-text">Reject</span>
          <span className="font-body text-[0.5em] font-medium px-[0.5em] py-[0.1875em] rounded-[0.25em] bg-status-approved-bg text-status-approved-text">Approve</span>
        </div>
      </div>
    </div>
  );
}

function SellSnapshot() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex items-center gap-[0.4375em]">
        <Lock size={11} strokeWidth={2} className="text-accent shrink-0" />
        <span className="font-body text-[0.625em] font-semibold text-text">Lead reserved</span>
        <span className="ml-auto font-mono text-[0.5em] text-accent">11,000 DA locked</span>
      </div>

      <div className="bg-bg-alt/60 rounded-[0.375em] p-[0.5em] flex flex-col gap-[0.3125em]">
        <div className="flex items-center justify-between">
          <span className="font-body text-[0.5625em] text-text-muted">Client</span>
          <span className="font-body text-[0.5625em] font-semibold text-text">Soltrans Logistique</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-[0.5625em] text-text-muted">Phone</span>
          <span className="font-mono text-[0.5625em] font-semibold text-text">+213 5•• ••• ••2</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-[0.5625em] text-text-muted">Tracking window</span>
          <span className="font-mono text-[0.5625em] font-semibold text-text">30 days</span>
        </div>
      </div>

      <div className="flex items-center gap-[0.3125em] font-body text-[0.5em] text-text-muted">
        <CheckCircle2 size={9} strokeWidth={2} className="text-accent" />
        Contact unlocked from escrow
      </div>
    </div>
  );
}

function SettleSnapshot() {
  return (
    <div className="flex flex-col gap-[0.5em]">
      <div className="flex items-center gap-[0.4375em]">
        <BadgeCheck size={11} strokeWidth={2} className="text-trend-positive shrink-0" />
        <span className="font-body text-[0.625em] font-semibold text-text">Sale confirmed</span>
        <span className="ml-auto font-mono text-[0.5em] text-text-muted">Today · 14:32</span>
      </div>

      <div className="bg-bg-alt/60 rounded-[0.375em] p-[0.5em] flex flex-col gap-[0.3125em]">
        <div className="flex items-center justify-between">
          <span className="font-body text-[0.5625em] text-text-muted">Sale amount</span>
          <span className="font-mono text-[0.5625em] font-semibold text-text">100,000 DA</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-[0.5625em] text-text-muted">Commission → partner</span>
          <span className="font-mono text-[0.5625em] font-semibold text-accent">10,000 DA</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-body text-[0.5625em] text-text-muted">Platform fee (10% of sale)</span>
          <span className="font-mono text-[0.5625em] font-semibold text-text-secondary">10,000 DA</span>
        </div>
      </div>

      <div className="flex items-center gap-[0.3125em] font-body text-[0.5em] text-trend-positive">
        <CheckCircle2 size={9} strokeWidth={2} />
        Released — partner gets 100%
      </div>
    </div>
  );
}

export const SNAPSHOTS = {
  list:   ListSnapshot,
  match:  MatchSnapshot,
  sell:   SellSnapshot,
  settle: SettleSnapshot,
};
