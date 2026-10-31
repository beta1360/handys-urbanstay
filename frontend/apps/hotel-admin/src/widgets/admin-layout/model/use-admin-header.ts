import { ACCOUNT_ROLE_LABELS, useMe } from "@/entities/account";
import { useCurrentTitle } from "./use-current-title";
import { useLogout } from "./use-logout";

export type HeaderAccount = {
  hotelName: string;
  name: string;
  roleLabel: string;
};

export function useAdminHeader() {
  const title = useCurrentTitle();
  const { data: me } = useMe();
  const { status: logoutStatus, logout } = useLogout();
  const account: HeaderAccount | undefined =
    me === undefined
      ? undefined
      : {
          hotelName: me.hotel.name,
          name: me.name,
          roleLabel: ACCOUNT_ROLE_LABELS[me.role],
        };

  return { title, account, logoutStatus, logout };
}
