"use client";

import { useLogoutButton } from "../model/use-logout-button";
import { LogoutButtonView } from "./logout-button-view";

export function LogoutButton() {
  const { isPending, handleLogout } = useLogoutButton();

  return <LogoutButtonView isPending={isPending} onLogout={handleLogout} />;
}
