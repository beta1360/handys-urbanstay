import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { showToast } from "@repo/admin-kit/toast";
import { useLogout as useLogoutRequest } from "@/features/auth-logout";

export type LogoutStatus = "idle" | "pending" | "failed";

export function useLogout() {
  const { logout: requestLogout } = useLogoutRequest();
  const navigate = useNavigate();
  const [status, setStatus] = useState<LogoutStatus>("idle");

  async function logout() {
    if (status === "pending") {
      return;
    }
    setStatus("pending");
    let message: string | undefined;
    try {
      message = (await requestLogout()).message;
    } catch {
      setStatus("failed");
      return;
    }
    if (message !== undefined) {
      showToast({ type: "success", message });
    }
    await navigate({ to: "/login" });
  }

  return { status, logout };
}
