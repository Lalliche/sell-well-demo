/**
 * Bucket items with a `created_at` ISO string into date groups for feed
 * rendering: Today / Yesterday / Earlier this week / Earlier.
 *
 * Returns an array of `{ key, items }` in display order, skipping empty
 * groups. The caller passes a translator scoped to a namespace that
 * provides labels for each key:
 *   today, yesterday, earlierThisWeek, earlier
 *
 * The returned `key` matches those translation keys verbatim so callers
 * can do `t(group.key)`.
 *
 * Boundaries (computed against the device's local timezone):
 *   today            — same calendar day as `now`
 *   yesterday        — previous calendar day
 *   earlierThisWeek  — older than yesterday but within the last 7 days
 *   earlier          — everything else
 *
 * Items are NOT re-sorted — caller is expected to pass them in
 * newest-first order; `fetchNotifications` already does this.
 */
export function groupByDate(items, now = new Date()) {
  const today = startOfDay(now).getTime();
  const yesterday = today - 86_400_000;
  const weekAgo = today - 7 * 86_400_000;

  const buckets = {
    today: [],
    yesterday: [],
    earlierThisWeek: [],
    earlier: [],
  };

  for (const item of items) {
    const ts = startOfDay(new Date(item.created_at)).getTime();
    if (ts >= today) buckets.today.push(item);
    else if (ts >= yesterday) buckets.yesterday.push(item);
    else if (ts >= weekAgo) buckets.earlierThisWeek.push(item);
    else buckets.earlier.push(item);
  }

  return ["today", "yesterday", "earlierThisWeek", "earlier"]
    .filter((k) => buckets[k].length > 0)
    .map((k) => ({ key: k, items: buckets[k] }));
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
