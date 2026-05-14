"use client";

/**
 * ProtectedRoute — wraps any route that requires an authenticated user.
 *
 * Waits for `ready` (first hydration tick) before deciding to redirect, so
 * a fully-authed user isn't bounced to /login during the brief window
 * before useSyncExternalStore reads localStorage.
 *
 * While not-yet-ready: renders a minimal loading spinner (cream bg, no
 * chrome) so the post-hydration paint doesn't flash.
 */

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !isAuthenticated) {
      router.replace("/login");
    }
  }, [ready, isAuthenticated, router]);

  if (!ready || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-[1.5em] h-[1.5em] border-[2px] border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
