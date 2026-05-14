/**
 * Role-aware sidebar nav configuration.
 *
 * Each nav item has:
 *   key   : translation key under `Dashboard.Nav.*`
 *   href  : locale-aware path (passed to <Link> from @/i18n/navigation)
 *   icon  : Lucide icon component (rendered with size="1.125em" by the caller)
 *
 * Items mirror the spec's per-role information architecture:
 *   - Sales Partner : campaigns-marketplace + escrow-leads + partner-links
 *   - Company       : campaigns + leads inbox + applications + escrow + partner-links perf
 *   - Admin         : verification queue + withdrawals + disputes + flags + reports + settings
 *
 * Routes that don't exist yet point at /dashboard so clicks don't 404 during
 * Phase 5 click-testing — they get pointed at the real routes as Phase 6/7/9
 * pages land.
 */

import {
  LayoutDashboard,
  Store,
  ClipboardList,
  Users,
  Inbox,
  FileSignature,
  Wallet,
  Link2,
  BarChart3,
  ShieldCheck,
  Banknote,
  Flag,
  AlertTriangle,
  Sliders,
  PieChart,
  Bell,
} from "lucide-react";

const PARTNER_NAV = [
  { key: "dashboard",     href: "/dashboard",     icon: LayoutDashboard },
  { key: "marketplace",   href: "/marketplace",   icon: Store },
  { key: "applications",  href: "/applications",  icon: ClipboardList },
  { key: "leads",         href: "/leads",         icon: Inbox },
  { key: "partnerLinks",  href: "/partner-links", icon: Link2 },
  { key: "earnings",      href: "/earnings",      icon: Wallet },
  { key: "notifications", href: "/notifications", icon: Bell },
];

const COMPANY_NAV = [
  { key: "dashboard",        href: "/dashboard",                icon: LayoutDashboard },
  { key: "campaigns",        href: "/campaigns",                icon: Store },
  { key: "leadsInbox",       href: "/leads",                    icon: Inbox },
  { key: "applications",     href: "/applications",             icon: FileSignature },
  { key: "escrow",           href: "/escrow",                   icon: Wallet },
  { key: "partnerLinksPerf", href: "/partner-links/performance", icon: BarChart3 },
  { key: "notifications",    href: "/notifications",            icon: Bell },
];

const ADMIN_NAV = [
  { key: "adminDashboard",  href: "/admin/dashboard",     icon: LayoutDashboard },
  { key: "users",           href: "/admin/users",         icon: Users },
  { key: "campaigns",       href: "/admin/campaigns",     icon: Store },
  { key: "verifications",   href: "/admin/verifications", icon: ShieldCheck },
  { key: "withdrawals",     href: "/admin/withdrawals",   icon: Banknote },
  { key: "disputes",        href: "/admin/disputes",      icon: AlertTriangle },
  { key: "flags",           href: "/admin/flags",         icon: Flag },
  { key: "reports",         href: "/admin/reports",       icon: PieChart },
  { key: "platformSettings",href: "/admin/settings",      icon: Sliders },
];

export function getNavForRole(role) {
  if (role === "sales_partner") return PARTNER_NAV;
  if (role === "company")       return COMPANY_NAV;
  if (role === "admin")         return ADMIN_NAV;
  return [];
}
