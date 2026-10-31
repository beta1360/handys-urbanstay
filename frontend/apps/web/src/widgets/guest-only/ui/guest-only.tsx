"use client";

import type { ReactNode } from "react";
import { LoadingMessage } from "@/shared/ui";
import { useGuestOnly } from "../model/use-guest-only";

type GuestOnlyProps = {
  redirectTo: string;
  children: ReactNode;
};

export function GuestOnly({ redirectTo, children }: GuestOnlyProps) {
  const status = useGuestOnly(redirectTo);

  return status === "guest" ? children : <LoadingMessage />;
}
