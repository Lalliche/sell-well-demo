/**
 * Notifications data hooks — React Query layer over `lib/mock/notifications.js`.
 *
 * Pattern lifted from the Spotlight project (`spotlight-client/src/lib/hooks/
 * useNotifications.ts`) and adapted to SellWell's `Notification` shape
 * (`is_read` instead of `read`, no precomputed `link` field).
 *
 * Three exports:
 *   useNotifications()   — list query, scoped to the current user, polls
 *                           every 30s (matches Spotlight; backend will swap
 *                           to push later).
 *   useMarkOneRead()     — mark a single notification read. Optimistic.
 *   useMarkAllRead()     — mark every notification for the current user read.
 *                           Optimistic.
 *
 * Optimistic strategy: `onMutate` patches every query cache that starts
 * with `["notifications", ...]` (so we update both the popover query and
 * any future per-page variants without coordinating). `onSettled` then
 * invalidates so the source of truth re-syncs from the mock (or, later,
 * the API).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  markRead,
  markAllRead,
} from "@/lib/mock/notifications";
import { useAuth } from "@/components/providers/AuthProvider";

const POLL_MS = 30_000;

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications", user?.id ?? null],
    queryFn: () => fetchNotifications({ userId: user?.id }),
    enabled: !!user,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  });
}

/** Patch every cache entry whose key starts with ["notifications", ...].
 *  `updater` receives the current array and returns the next one. */
function patchAllNotificationCaches(qc, updater) {
  const entries = qc.getQueriesData({ queryKey: ["notifications"] });
  entries.forEach(([key, current]) => {
    if (!Array.isArray(current)) return;
    qc.setQueryData(key, updater(current));
  });
}

export function useMarkOneRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => markRead(id),
    onMutate: (id) => {
      patchAllNotificationCaches(qc, (old) =>
        old.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["notifications"], exact: false }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => markAllRead({ userId: user?.id }),
    onMutate: () => {
      patchAllNotificationCaches(qc, (old) =>
        old.map((n) => ({ ...n, is_read: true })),
      );
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ["notifications"], exact: false }),
  });
}
