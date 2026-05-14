"use client";

/**
 * Middle section of the sidebar — the role-aware nav stack.
 * Wraps each nav row from `getNavForRole(role)` in a SidebarNavItem.
 */

import { getNavForRole } from "./nav-config";
import SidebarNavItem from "./SidebarNavItem";

export default function SidebarNavList({ role, collapsed }) {
  const items = getNavForRole(role);
  return (
    <nav
      aria-label="Primary"
      className="flex-1 overflow-x-hidden min-h-0 overflow-y-auto flex flex-col gap-[0.125em] px-[0.5em] py-[0.5em]"
    >
      {items.map((item) => (
        <SidebarNavItem key={item.key} item={item} collapsed={collapsed} />
      ))}
    </nav>
  );
}
