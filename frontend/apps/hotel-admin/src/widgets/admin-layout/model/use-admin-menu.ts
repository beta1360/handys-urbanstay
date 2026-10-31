import { isMaster, useMe } from "@/entities/account";
import { ADMIN_MENU_ITEMS } from "../config/menu";

export function useAdminMenu() {
  const { data: me } = useMe();
  const canSeeMasterMenu = me !== undefined && isMaster(me);

  return ADMIN_MENU_ITEMS.filter(
    (item) => !item.masterOnly || canSeeMasterMenu,
  );
}
