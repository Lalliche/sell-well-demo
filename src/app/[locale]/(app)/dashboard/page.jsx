"use client";

/**
 * /dashboard — single route, role-branched.
 *
 *   sales_partner → <PartnerDashboard /> (Phase 6.1)
 *   company       → <CompanyDashboard /> (Phase 7.1)
 *   admin         → <AdminDashboard />   (Phase 9.1, placeholder for now)
 *
 * Admin still falls through to the inline placeholder until Phase 9.1 ships.
 */

import { useAuth } from "@/components/providers/AuthProvider";
import PageHeader from "@/components/shared/layout/PageHeader";
import PartnerDashboard from "@/components/dashboard/partner/PartnerDashboard";
import CompanyDashboard from "@/components/dashboard/company/CompanyDashboard";

export default function DashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "sales_partner") return <PartnerDashboard />;
  if (user.role === "company")       return <CompanyDashboard />;

  // Admin still on placeholder — until Phase 9.1.
  return <RolePlaceholder user={user} />;
}

function RolePlaceholder({ user }) {
  return (
    <div className="px-[2em] py-[2em]">
      <PageHeader
        title="Welcome back, admin."
        description="Admin dashboard widgets land in Phase 9.1. For now, this is the chrome you're click-testing."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1em]">
        <Stat label="Role" value={user.role} mono />
        <Stat label="Application status" value={user.application_status} mono />
        <Stat label="Email verified" value={user.is_email_verified ? "yes" : "no"} mono />
        <Stat label="User ID" value={`#${user.id}`} mono />
      </div>
    </div>
  );
}

function Stat({ label, value, mono }) {
  return (
    <div className="bg-bg-alt border border-border-light rounded-[0.625em] p-[1em] flex flex-col gap-[0.25em]">
      <span className="text-[0.6875em] uppercase tracking-[0.08em] text-text-muted font-semibold">
        {label}
      </span>
      <span className={mono ? "font-mono text-[0.875em] text-text" : "text-[0.875em] text-text"}>
        {value}
      </span>
    </div>
  );
}
