"use client";

/**
 * Hook that owns the data layer for the Preferences tab.
 *
 * Three responsibilities:
 *   1. Fetch the user's preference rows via React Query.
 *   2. Merge them with the role-filtered catalog from
 *      `_seed/notification-events.ts` to compute the per-event values
 *      shown in the UI.
 *   3. Expose a debounced `setEmail(eventType, value)` that flips the
 *      value instantly (optimistic), schedules a 1.2s timer, and
 *      eventually fires `updateNotificationPreference` once. Re-flips
 *      within the window reset the timer (typical Mercury/Linear UX).
 *
 * Why debounce: the row UI is N independent booleans. With a global Save
 * button users get dirty-state anxiety; with per-row Save buttons the page
 * gets visually noisy. Auto-save matches the "I flipped a switch, it
 * sticks" mental model.
 *
 * Why optimistic patch: the user expects the toggle to commit visually
 * before the network round-trip lands. React Query's cache is patched
 * inside `setEmail`; the actual server call only runs after the debounce
 * window closes.
 *
 * "Saved" pill state lives here too — each successful upsert flips a
 * per-event `savedAt` to `Date.now()`. The card UI shows the pill for
 * ~2s after the timestamp.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/mock/notification-preferences";
import { NOTIFICATION_EVENT_CATALOG } from "@/lib/mock/_seed/notification-events";

const DEBOUNCE_MS = 1200;
const SAVED_PILL_MS = 2000;

/** Merge catalog defaults with the user's overrides → per-event state.
 *  Returns a Map keyed by event_type with `{ email, in_app, channels, group, role }`. */
function mergeCatalogWithPrefs(catalogRows, prefRows) {
  const byEventType = new Map();
  for (const entry of catalogRows) {
    byEventType.set(entry.event_type, {
      event_type: entry.event_type,
      role: entry.role,
      group: entry.group,
      channels: entry.channels,
      email: entry.default_email,
      in_app: entry.default_in_app,
    });
  }
  for (const pref of prefRows) {
    const current = byEventType.get(pref.event_type);
    // Only apply if the catalog has an entry for this event_type AND the
    // pref's role matches (catalog entries are role-scoped; a partner pref
    // row for a company event would not apply). The catalog itself is the
    // role filter — if the entry isn't there for this role, skip.
    if (current) {
      byEventType.set(pref.event_type, {
        ...current,
        email: pref.email,
        in_app: pref.in_app,
      });
    }
  }
  return byEventType;
}

export function useNotificationPreferences({ userId, role } = {}) {
  const qc = useQueryClient();
  const queryKey = useMemo(
    () => ["notification-preferences", { userId }],
    [userId],
  );

  // 1) Server state — the user's override rows.
  const { data: prefRows = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotificationPreferences({ userId }),
    enabled: typeof userId === "number",
  });

  // 2) Role-filtered catalog. Memoized so the reference is stable across
  // renders — the merged map below depends on it.
  const catalog = useMemo(
    () => NOTIFICATION_EVENT_CATALOG.filter((c) => c.role === role),
    [role],
  );

  // 3) Merge — applied during render, NOT inside a useEffect (per the
  // setState-in-effect hard rule).
  const merged = useMemo(
    () => mergeCatalogWithPrefs(catalog, prefRows),
    [catalog, prefRows],
  );

  // 4) Group rows by group key, preserving catalog order within each group.
  const groups = useMemo(() => {
    const out = new Map();
    for (const entry of catalog) {
      const merged_entry = merged.get(entry.event_type);
      if (!merged_entry) continue;
      const arr = out.get(entry.group) ?? [];
      arr.push(merged_entry);
      out.set(entry.group, arr);
    }
    return [...out.entries()].map(([group, rows]) => ({ group, rows }));
  }, [catalog, merged]);

  // 5) Per-event Saved pill timestamps. Declared before the mutation so
  //    `onSuccess` closes over a real setter, not a TDZ reference.
  const [savedAt, setSavedAt] = useState(() => new Map());
  // Pill expiry timers — one per event_type. `onSuccess` schedules a
  // re-render after the pill window so the card recomputes and the pill
  // fades out; cleanup cancels every pending timer.
  const pillExpiryTimersRef = useRef(new Map());

  // 6) Mutation.
  const mutation = useMutation({
    mutationFn: ({ eventType, patch }) =>
      updateNotificationPreference({ userId, eventType, patch }),
    onSuccess: (row) => {
      // Patch the cache so the next read reflects the new row without a
      // refetch. The reducer prefers an existing match; otherwise it
      // appends.
      qc.setQueryData(queryKey, (prev = []) => {
        const i = prev.findIndex(
          (p) => p.user === row.user && p.event_type === row.event_type,
        );
        if (i === -1) return [...prev, row];
        const next = prev.slice();
        next[i] = row;
        return next;
      });
      // Flip the per-event saved pill timestamp.
      setSavedAt((m) => {
        const next = new Map(m);
        next.set(row.event_type, Date.now());
        return next;
      });
      // Schedule a re-render after the pill window so the card recomputes
      // and the pill fades out. Without this, `now - savedTimestamp` only
      // re-evaluates on the next external state change. Tracked + cleared
      // by `pillExpiryTimersRef` so we never leak timers on unmount.
      const existing = pillExpiryTimersRef.current.get(row.event_type);
      if (existing) clearTimeout(existing);
      const handle = setTimeout(() => {
        pillExpiryTimersRef.current.delete(row.event_type);
        // Force a re-render by re-setting the same Map reference under a
        // new identity. Cheaper than an extra useState + tick counter.
        setSavedAt((m) => new Map(m));
      }, SAVED_PILL_MS + 100);
      pillExpiryTimersRef.current.set(row.event_type, handle);
    },
  });

  // 7) Debounce queue — one pending patch per event_type. The Map value is
  //    a timeout handle. Re-flips clear + reschedule.
  const timersRef = useRef(new Map());
  // Latest desired email value per event (so the UI can render the
  // optimistic state even before the debounced call fires).
  const optimisticRef = useRef(new Map());
  // Force a re-render when optimisticRef changes (refs don't trigger
  // re-renders by themselves).
  const [, forceTick] = useState(0);

  // Cleanup on unmount — cancel every pending timer (debounce + pill
  // expiry). Both Maps are owned refs, so re-binding inside the cleanup
  // closure is the canonical pattern.
  useEffect(() => {
    const debounceTimers = timersRef.current;
    const pillTimers = pillExpiryTimersRef.current;
    return () => {
      for (const t of debounceTimers.values()) clearTimeout(t);
      for (const t of pillTimers.values()) clearTimeout(t);
      debounceTimers.clear();
      pillTimers.clear();
    };
  }, []);

  const setEmail = useCallback(
    (eventType, value) => {
      // Optimistic UI patch.
      optimisticRef.current.set(eventType, value);
      forceTick((n) => n + 1);

      // Reset any in-flight timer for this event.
      const existing = timersRef.current.get(eventType);
      if (existing) clearTimeout(existing);

      const handle = setTimeout(() => {
        timersRef.current.delete(eventType);
        // Read the latest desired value at the time the timer fires —
        // covers the case where the user flipped twice within the window.
        const desired = optimisticRef.current.get(eventType);
        optimisticRef.current.delete(eventType);
        mutation.mutate({ eventType, patch: { email: desired } });
      }, DEBOUNCE_MS);

      timersRef.current.set(eventType, handle);
    },
    [mutation],
  );

  /** Mute every email-capable row in a group. Iterates the group's rows and
   *  schedules a debounced patch for each. The cards' "Mute all email" CTA
   *  calls this. */
  const muteGroupEmail = useCallback(
    (group) => {
      const groupRows = groups.find((g) => g.group === group)?.rows ?? [];
      for (const row of groupRows) {
        if (row.channels !== "in_app_and_email") continue;
        // Resolve current optimistic value (if any) → fall back to merged.
        const current =
          optimisticRef.current.get(row.event_type) ?? row.email;
        if (current === false) continue;
        setEmail(row.event_type, false);
      }
    },
    [groups, setEmail],
  );

  /** Restore the catalog default for every row in a group. Pairs with
   *  `muteGroupEmail` so the user can flip an entire card on/off in two
   *  clicks. */
  const enableGroupEmail = useCallback(
    (group) => {
      const groupRows = groups.find((g) => g.group === group)?.rows ?? [];
      for (const row of groupRows) {
        if (row.channels !== "in_app_and_email") continue;
        const current =
          optimisticRef.current.get(row.event_type) ?? row.email;
        if (current === true) continue;
        setEmail(row.event_type, true);
      }
    },
    [groups, setEmail],
  );

  /** Resolve the email value the UI should render for a given event —
   *  the optimistic override if present, else the merged value. */
  const getDisplayedEmail = useCallback(
    (eventType, mergedEmail) => {
      const opt = optimisticRef.current.get(eventType);
      return opt === undefined ? mergedEmail : opt;
    },
    [],
  );

  return {
    isLoading,
    groups,
    setEmail,
    muteGroupEmail,
    enableGroupEmail,
    getDisplayedEmail,
    savedAt,
    savedPillMs: SAVED_PILL_MS,
  };
}
