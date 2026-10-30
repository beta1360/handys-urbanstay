import { useAdminHeader } from "../model/use-admin-header";
import { AdminHeaderBar } from "./admin-header-bar";

export function AdminHeader() {
  const { title, accountName, logoutStatus, logout } = useAdminHeader();

  return (
    <AdminHeaderBar
      title={title}
      accountName={accountName}
      logoutStatus={logoutStatus}
      onLogout={logout}
    />
  );
}
