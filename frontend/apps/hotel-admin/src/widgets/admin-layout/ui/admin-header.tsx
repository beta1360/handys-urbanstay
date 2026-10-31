import { useAdminHeader } from "../model/use-admin-header";
import { AdminHeaderBar } from "./admin-header-bar";

export function AdminHeader() {
  const { title, account, logoutStatus, logout } = useAdminHeader();

  return (
    <AdminHeaderBar
      title={title}
      account={account}
      logoutStatus={logoutStatus}
      onLogout={logout}
    />
  );
}
