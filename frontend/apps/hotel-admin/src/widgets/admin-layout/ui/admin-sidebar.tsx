import { useAdminMenu } from "../model/use-admin-menu";
import { AdminSidebarNav } from "./admin-sidebar-nav";

export function AdminSidebar() {
  const items = useAdminMenu();

  return <AdminSidebarNav items={items} />;
}
