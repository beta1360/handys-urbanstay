"use client";

import { LogoutButton } from "@/features/auth-logout";
import { useHeaderAuth } from "../model/use-header-auth";
import { HeaderGuestLinks } from "./header-guest-links";
import { HeaderMemberMenu } from "./header-member-menu";

export function HeaderAuth() {
  const state = useHeaderAuth();

  if (state.status === "member") {
    return (
      <HeaderMemberMenu name={state.name}>
        <LogoutButton />
      </HeaderMemberMenu>
    );
  }
  if (state.status === "guest") {
    return (
      <HeaderGuestLinks
        loginHref={state.loginHref}
        signupHref={state.signupHref}
      />
    );
  }
  return null;
}
