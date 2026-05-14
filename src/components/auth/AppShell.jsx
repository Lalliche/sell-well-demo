"use client";

/**
 * AppShell — branches the protected layout's render based on the user's
 * verification state.
 *
 *   application_status === "rejected"  → full-screen RejectedScreen,
 *                                        children NOT rendered.
 *   anything else                       → children render directly. The
 *                                        verification banners (email +
 *                                        application status) are now
 *                                        rendered INSIDE the dashboard
 *                                        TopHeader as compact pills, not
 *                                        as a top-of-page band. AppShell
 *                                        no longer touches them.
 *
 * The RoleSwitcher (dev-only floating pill) renders in both branches so
 * we can test the rejection state.
 */

import { useAuth } from "@/components/providers/AuthProvider";
import RejectedScreen from "@/components/auth/RejectedScreen";
import RoleSwitcher from "@/components/auth/RoleSwitcher";

export default function AppShell({ children }) {
  const { user } = useAuth();
  const isRejected = user?.application_status === "rejected";

  return (
    <>
      {isRejected ? <RejectedScreen /> : children}
      <RoleSwitcher />
    </>
  );
}
