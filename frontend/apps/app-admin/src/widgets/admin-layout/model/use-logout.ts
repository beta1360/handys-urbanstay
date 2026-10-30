import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useLogout as useLogoutRequest } from "@/features/auth-logout";

type LogoutStatus = "idle" | "pending" | "failed";

export function useLogout() {
  const { logout: requestLogout } = useLogoutRequest();
  const navigate = useNavigate();
  const [status, setStatus] = useState<LogoutStatus>("idle");

  async function logout() {
    if (status === "pending") {
      return;
    }
    setStatus("pending");
    try {
      await requestLogout();
    } catch {
      setStatus("failed");
      return;
    }
    await navigate({ to: "/login" });
  }

  return {
    logout,
    isPending: status === "pending",
    isFailed: status === "failed",
  };
}
