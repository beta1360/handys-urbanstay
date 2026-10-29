import { Link } from "@tanstack/react-router";
import { Sidebar, SidebarItem } from "@repo/ui/sidebar";
import { APP_INFO } from "@/shared/config";
import { ADMIN_MENU_ITEMS } from "../config/menu";
import { ADMIN_LAYOUT_MESSAGES } from "../config/messages";

export function AdminSidebar() {
  return (
    <div className="flex shrink-0 flex-col">
      <div className="flex h-14 shrink-0 items-center border-r border-neutral-200 bg-white px-6 text-base font-bold text-neutral-900">
        {APP_INFO.name}
      </div>
      <Sidebar
        aria-label={ADMIN_LAYOUT_MESSAGES.sidebarLabel}
        className="flex-1"
      >
        {ADMIN_MENU_ITEMS.map((item) => (
          <SidebarItem key={item.to}>
            <Link to={item.to} activeOptions={{ exact: item.exact }}>
              {item.label}
            </Link>
          </SidebarItem>
        ))}
      </Sidebar>
    </div>
  );
}
