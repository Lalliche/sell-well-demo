// HeroMockup — decorative browser-chrome dashboard for the Hero section.
// Swap inner content with real dashboard components when the dashboard phase ships.

import {
  LayoutDashboard, Store, Users, Briefcase,
  Wallet, Banknote, Search, Bell,
  TrendingUp, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LEADS = [
  { initials: "OB", name: "Oussama Benali", sub: "Collab.dz · Project Mgmt", amount: "د.ج 42,750", status: "Confirmed", variant: "approved" },
  { initials: "AK", name: "Amine Kaddour",  sub: "PayFlow · Invoicing",       amount: "د.ج 28,400", status: "Pending",   variant: "pending"  },
  { initials: "YD", name: "Yacine Daoud",   sub: "HRSync · HR Platform",      amount: "د.ج 36,000", status: "Confirmed", variant: "approved" },
];

const BADGE_VARIANTS = {
  approved: "bg-status-approved-bg text-status-approved-text",
  pending:  "bg-status-pending-bg  text-status-pending-text",
  active:   "bg-status-active-bg   text-status-active-text",
};

function SideNavItem({ icon: Icon, label, active, badge }) {
  return (
    <div className={cn(
      "relative flex items-center gap-[0.625em] px-[0.625em] py-[0.5em] rounded-[0.375em]",
      "text-[0.8125em] font-body cursor-default",
      active
        ? "bg-[var(--accent-light)] text-accent-text font-semibold"
        : "text-text-secondary"
    )}>
      {active && (
        <span className="absolute left-[-0.75em] top-[0.375em] bottom-[0.375em] w-[2px] bg-accent rounded-r-[2px]" />
      )}
      <Icon size={14} strokeWidth={1.5} />
      {label}
      {badge && (
        <span className="ml-auto font-mono text-[0.625em] font-semibold bg-accent text-white px-[0.375em] py-[0.0625em] rounded-full">
          {badge}
        </span>
      )}
    </div>
  );
}

function StatCard({ label, icon: Icon, value, accent, trend, trendPositive, trendMuted, featured }) {
  return (
    <div className={cn(
      "bg-surface border border-border-light rounded-[0.625em] p-[0.875em_1em] cursor-default",
      featured && "border-t-2 border-t-accent"
    )}>
      <div className="flex justify-between items-start mb-[0.5em]">
        <span className="font-body text-[0.625em] font-semibold tracking-[0.06em] uppercase text-text-muted">
          {label}
        </span>
        <span className="w-[1.375em] h-[1.375em] rounded-[0.375em] flex items-center justify-center bg-[var(--accent-light)] text-accent">
          <Icon size={12} strokeWidth={1.5} />
        </span>
      </div>
      <div className={cn(
        "font-mono text-[1.375em] font-semibold tracking-[-0.02em] mb-[0.25em]",
        accent ? "text-accent" : "text-text"
      )}>
        {value}
      </div>
      {trend && (
        <div className={cn(
          "font-body text-[0.6875em] flex items-center gap-[0.25em]",
          trendPositive && "text-trend-positive",
          trendMuted && "text-text-muted",
          !trendPositive && !trendMuted && "text-text-muted"
        )}>
          {trendPositive && <TrendingUp size={11} strokeWidth={1.5} />}
          {trend}
        </div>
      )}
    </div>
  );
}

export default function HeroMockup() {
  return (
    <div
      aria-hidden="true"
      className="select-none bg-surface border border-border rounded-[1em] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.06),0_30px_80px_rgba(26,26,26,0.14)]"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-[0.875em] px-[1.125em] py-[0.75em] bg-bg-alt border-b border-border-light">
        <div className="flex gap-[0.4375em]">
          <span className="block w-[0.75em] h-[0.75em] rounded-full bg-[#FF5F57]" />
          <span className="block w-[0.75em] h-[0.75em] rounded-full bg-[#FFBD2E]" />
          <span className="block w-[0.75em] h-[0.75em] rounded-full bg-[#28CA41]" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-[0.5em] bg-surface border border-border-light rounded-[0.375em] px-[0.875em] py-[0.3125em] max-w-[20em] font-body text-[0.75em] text-text-muted">
            <Lock size={11} strokeWidth={2.5} className="text-trend-positive" />
            app.sellwell.dz/dashboard
          </div>
        </div>
        <div className="w-[3.75em]" />
      </div>

      {/* Body: sidebar + content */}
      <div className="grid grid-cols-[220px_1fr] min-h-[30em] bg-bg">

        {/* Sidebar */}
        <div className="flex flex-col bg-bg-alt border-r border-border-light p-[1.125em_0.75em]">
          {/* Logo */}
          <div className="flex items-center gap-[0.5625em] font-heading font-bold text-[0.9375em] tracking-[-0.02em] px-[0.5em] pb-[1em] mb-[0.875em] border-b border-border-light">
            <div className="flex gap-[0.15625em] items-end">
              <span className="block w-[3.5px] h-[11px] rounded-[1.5px] bg-accent" />
              <span className="block w-[3.5px] h-[16px] rounded-[1.5px] bg-accent" />
              <span className="block w-[3.5px] h-[21px] rounded-[1.5px] bg-accent" />
            </div>
            <span className="text-text">Sell<span className="text-accent">Well</span></span>
          </div>

          <p className="font-body text-[0.625em] font-semibold tracking-[0.08em] uppercase text-text-muted px-[0.625em] pt-[0.375em] pb-[0.25em]">Workspace</p>
          <div className="flex flex-col gap-[1px]">
            <SideNavItem icon={LayoutDashboard} label="Dashboard"   active />
            <SideNavItem icon={Store}           label="Marketplace" />
            <SideNavItem icon={Users}           label="My Leads"    badge="12" />
            <SideNavItem icon={Briefcase}       label="Programs"    />
          </div>

          <p className="font-body text-[0.625em] font-semibold tracking-[0.08em] uppercase text-text-muted px-[0.625em] pt-[0.625em] pb-[0.25em] mt-[0.25em]">Finance</p>
          <div className="flex flex-col gap-[1px]">
            <SideNavItem icon={Wallet}   label="Commissions" />
            <SideNavItem icon={Banknote} label="Payouts"     />
          </div>

          {/* User */}
          <div className="mt-auto flex items-center gap-[0.625em] border-t border-border-light pt-[1em]">
            <div className="w-[2em] h-[2em] rounded-full bg-[var(--accent-light)] text-accent flex items-center justify-center font-heading text-[0.75em] font-bold shrink-0">
              KA
            </div>
            <div>
              <div className="font-body text-[0.75em] font-semibold text-text">Karim A.</div>
              <div className="font-body text-[0.6875em] text-text-muted">karim@sellwell.dz</div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-[1.375em_1.625em] overflow-hidden">

          {/* Topbar */}
          <div className="flex justify-between items-start mb-[1.375em]">
            <div>
              <div className="font-heading text-[1.125em] font-bold tracking-[-0.02em] text-text mb-[0.125em]">Dashboard</div>
              <div className="font-body text-[0.75em] text-text-muted">Welcome back, Karim — here's what's moving today</div>
            </div>
            <div className="flex gap-[0.5em] items-center">
              <div className="flex items-center gap-[0.375em] bg-surface border border-border-light rounded-[0.375em] px-[0.625em] py-[0.375em] font-body text-[0.6875em] text-text-muted min-w-[11.25em]">
                <Search size={12} strokeWidth={1.5} /> Search…
              </div>
              <div className="w-[1.75em] h-[1.75em] rounded-[0.375em] bg-surface border border-border-light flex items-center justify-center text-text-secondary">
                <Bell size={13} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-[0.75em] mb-[1.125em]">
            <StatCard label="Total Earnings"   icon={Wallet}    value="د.ج 284,500" accent featured trend="+23% this month"    trendPositive />
            <StatCard label="Active Programs"  icon={Briefcase} value="4"                          trend="2 pending review"    trendMuted    />
            <StatCard label="Leads This Month" icon={Users}     value="18"                         trend="+6 from last month"  trendPositive />
          </div>

          {/* Lower panels */}
          <div className="grid grid-cols-[1.5fr_1fr] gap-[0.75em]">

            {/* Recent leads */}
            <div className="bg-surface border border-border-light rounded-[0.625em] p-[0.875em_1em]">
              <div className="flex justify-between items-center mb-[0.75em]">
                <span className="font-heading text-[0.8125em] font-bold tracking-[-0.01em] text-text">Recent Leads</span>
                <span className="font-body text-[0.6875em] font-semibold text-accent-text">View all →</span>
              </div>
              {LEADS.map(({ initials, name, sub, amount, status, variant }, idx) => (
                <div
                  key={name}
                  className={cn(
                    "grid grid-cols-[1.5em_1fr_auto_auto] gap-[0.625em] items-center py-[0.5em]",
                    idx > 0 && "border-t border-border-light"
                  )}
                >
                  <div className="w-[1.5em] h-[1.5em] rounded-full bg-[var(--accent-light)] text-accent flex items-center justify-center font-heading text-[0.5625em] font-bold">
                    {initials}
                  </div>
                  <div>
                    <div className="font-body text-[0.75em] font-semibold text-text">{name}</div>
                    <div className="font-body text-[0.6875em] text-text-muted">{sub}</div>
                  </div>
                  <div className="font-mono text-[0.75em] font-semibold text-accent">{amount}</div>
                  <span className={cn("font-body text-[0.625em] font-semibold px-[0.5em] py-[0.125em] rounded-[0.25em]", BADGE_VARIANTS[variant])}>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            {/* Earnings chart */}
            <div className="bg-surface border border-border-light rounded-[0.625em] p-[0.875em_1em]">
              <div className="flex justify-between items-center mb-[0.5em]">
                <span className="font-heading text-[0.8125em] font-bold tracking-[-0.01em] text-text">Earnings (30d)</span>
                <span className={cn("font-body text-[0.625em] font-semibold px-[0.5em] py-[0.125em] rounded-[0.25em]", BADGE_VARIANTS.active)}>
                  +23%
                </span>
              </div>
              <div className="h-[5em] mt-[0.5em] relative">
                <svg viewBox="0 0 240 80" preserveAspectRatio="none" className="w-full h-full block">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#3B6ECC" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#3B6ECC" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#chartGrad)" d="M 0 60 L 20 55 L 40 50 L 60 52 L 80 42 L 100 45 L 120 35 L 140 30 L 160 28 L 180 22 L 200 18 L 220 14 L 240 10 L 240 80 L 0 80 Z" />
                  <path fill="none" stroke="#3B6ECC" strokeWidth="2" d="M 0 60 L 20 55 L 40 50 L 60 52 L 80 42 L 100 45 L 120 35 L 140 30 L 160 28 L 180 22 L 200 18 L 220 14 L 240 10" />
                  <circle cx="240" cy="10" r="3.5" fill="white" stroke="#3B6ECC" strokeWidth="2" className="drop-shadow-[0_0_6px_rgba(59,110,204,0.4)]" />
                </svg>
                <div className="absolute top-[-0.25em] right-0 bg-text text-white font-mono text-[0.625em] font-semibold px-[0.5em] py-[0.1875em] rounded-[0.25em]">
                  د.ج 284,500
                  <span className="absolute bottom-[-3px] right-[12px] w-[6px] h-[6px] bg-text rotate-45 block" />
                </div>
              </div>
              <div className="flex justify-between mt-[0.5em] font-body text-[0.625em] text-text-muted">
                <span>1 Apr</span><span>15 Apr</span><span>30 Apr</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
