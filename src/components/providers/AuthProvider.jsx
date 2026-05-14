"use client";

/**
 * AuthProvider (mock).
 *
 * Bridges localStorage to React via `useSyncExternalStore` — sanctioned hook
 * for external mutable sources, no setState-in-effect-body violations.
 * Gives us cross-tab sync via `storage` events for free; same-tab updates
 * fire a custom `sellwell:auth-change` event.
 *
 * SSR returns null via `getServerSnapshot`; first paint never shows logged-in
 * chrome. Route guards must wait on `ready` before deciding to redirect —
 * `ready` flips true on the first post-hydration tick via rAF.
 *
 * The dev-only `?devAs=partner|company|admin` URL param auto-seeds the
 * session on first load when no user is stored. Hard-gated on NODE_ENV so
 * production builds are no-ops.
 *
 * When the real backend ships: only the bodies of `lib/mock/auth.js`
 * change. This provider's surface stays identical.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  AUTH_CHANGE_EVENT,
  AUTH_STORAGE_KEY,
  fetchCurrentUser,
  loginUser as authLogin,
  loginAsRole as authLoginAsRole,
  loginAsUserId as authLoginAsUserId,
  logoutUser as authLogout,
  readStoredUser,
} from "@/lib/mock/auth";
import { MOCK_PARTNER_PROFILES } from "@/lib/mock/_seed/partner-profiles";
import { MOCK_COMPANY_PROFILES } from "@/lib/mock/_seed/company-profiles";
import {
  readRoleCookieClient,
  setRoleCookie,
  clearRoleCookie,
} from "@/lib/auth-cookie";

const AuthContext = createContext(null);

/* ── External-store glue ───────────────────────────────────────────────── */

function subscribeToAuthStorage(onChange) {
  const handler = () => {
    invalidateSnapshotCache();
    onChange();
  };
  const onStorage = (e) => {
    if (e.key === AUTH_STORAGE_KEY) handler();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, handler);
  };
}

/** useSyncExternalStore requires snapshot referential stability — calling
 *  getClientSnapshot twice in a row with no change MUST return ===-equal
 *  values, otherwise React detects an infinite loop. We cache by user id
 *  and only rebuild when localStorage flips. */
let _snapshotCache = { id: null, value: null };

function buildSnapshot(user) {
  if (!user) return null;
  let profile = null;
  if (user.role === "sales_partner") {
    profile = MOCK_PARTNER_PROFILES.find((p) => p.user === user.id) ?? null;
  } else if (user.role === "company") {
    profile = MOCK_COMPANY_PROFILES.find((p) => p.user === user.id) ?? null;
  }
  return { ...user, profile };
}

function getClientSnapshot() {
  const user = readStoredUser();
  const id = user?.id ?? null;
  if (_snapshotCache.id === id) return _snapshotCache.value;
  _snapshotCache = { id, value: buildSnapshot(user) };
  return _snapshotCache.value;
}

/** Reset the cache — called inside subscribe() when the storage event or
 *  the same-tab `sellwell:auth-change` event fires, so the next snapshot
 *  read picks up the new user. */
function invalidateSnapshotCache() {
  _snapshotCache = { id: null, value: null };
}

function getServerSnapshot() {
  return null;
}

/* ── Provider ──────────────────────────────────────────────────────────── */

export function AuthProvider({ children }) {
  const user = useSyncExternalStore(
    subscribeToAuthStorage,
    getClientSnapshot,
    getServerSnapshot,
  );

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;

    // Dev-only: ?devAs=partner|company|admin auto-seeds a mock session on
    // first load when there's no user. Must run BEFORE we flip ready,
    // otherwise route guards see (ready=true, user=null) and redirect to
    // /login before the auto-login takes effect.
    if (process.env.NODE_ENV !== "production") {
      const existing = readStoredUser();
      if (!existing) {
        const params = new URLSearchParams(window.location.search);
        const devAs = params.get("devAs");
        if (devAs === "partner") authLoginAsRole("sales_partner");
        else if (devAs === "company") authLoginAsRole("company");
        else if (devAs === "admin") authLoginAsRole("admin");
        if (devAs) window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
      }
    }

    // Cookie re-sync: any dev session pre-dating the role-cookie shim still
    // has a localStorage user but no cookie — middleware would 404 it. Mirror
    // the role into the cookie on mount when the two diverge.
    const stored = readStoredUser();
    const cookieRole = readRoleCookieClient();
    if (stored && stored.role !== cookieRole) {
      setRoleCookie(stored.role);
    } else if (!stored && cookieRole) {
      clearRoleCookie();
    }

    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [ready]);

  const login = useCallback(async (email, password) => {
    const next = await authLogin({ email, password });
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    return next;
  }, []);

  const loginAsRole = useCallback((role) => {
    const next = authLoginAsRole(role);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    return next;
  }, []);

  const loginAsUserId = useCallback((id) => {
    const next = authLoginAsUserId(id);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    return next;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }, []);

  const refetch = useCallback(async () => {
    // For mock: localStorage is the source of truth, so we just re-read it.
    // For real backend: this will hit GET /api/me/ via React Query
    // invalidation in a later phase.
    await fetchCurrentUser();
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: !!user,
      login,
      loginAsRole,
      loginAsUserId,
      logout,
      refetch,
    }),
    [user, ready, login, loginAsRole, loginAsUserId, logout, refetch],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Consume auth state anywhere below AuthProvider. Throws if used outside. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
