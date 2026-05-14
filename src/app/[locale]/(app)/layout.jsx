import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppShell from "@/components/auth/AppShell";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Protected app layout. Used by all post-login routes (dashboard,
 * marketplace, leads, etc.).
 *
 * Nesting (top-down):
 *   ProtectedRoute  — auth guard, redirects to /login if not authenticated
 *   AppShell        — verification banners + RejectedScreen branch
 *   DashboardShell  — sidebar + top header + white content card (Phase 5.1–5.3)
 *   {children}      — page content, renders inside the white content card
 */
export default function AppLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardShell>{children}</DashboardShell>
      </AppShell>
    </ProtectedRoute>
  );
}
