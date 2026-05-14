"use client";

/**
 * SidebarToggleButton — left-most header control. Lives in the top header
 * strip (not in the sidebar) so its position is fixed regardless of
 * sidebar state — muscle memory wins.
 *
 * Renders a sidebar-with-chevron icon. The chevron flips direction based
 * on collapsed state.
 */

import { PanelLeft, PanelLeftOpen } from "lucide-react";
import IconButton from "@/components/shared/data-display/IconButton";
import { useTranslations } from "next-intl";

export default function SidebarToggleButton({ collapsed, onToggle, disabled }) {
  const t = useTranslations("Dashboard.Header");
  const Icon = collapsed ? PanelLeftOpen : PanelLeft;

  return (
    <IconButton
      ariaLabel={collapsed ? t("expandSidebar") : t("collapseSidebar")}
      onClick={onToggle}
      disabled={disabled}
      size="md"
    >
      <Icon size="1.125em" strokeWidth={1.75} />
    </IconButton>
  );
}
