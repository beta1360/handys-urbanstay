import { useMe } from "@/entities/account";
import { useCurrentTitle } from "./use-current-title";
import { useLogout } from "./use-logout";

export function useAdminHeader() {
  const title = useCurrentTitle();
  const { data: account } = useMe();
  const { status: logoutStatus, logout } = useLogout();

  return { title, accountName: account?.name, logoutStatus, logout };
}
