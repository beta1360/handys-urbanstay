import { Outlet } from "@tanstack/react-router";
import { AdminHeader } from "./admin-header";
import { AdminSidebar } from "./admin-sidebar";

export function AdminLayout() {
  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
