import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { API_ERROR_CODES, getApiError, logoutAccount } from "@/shared/api";

type LogoutStatus = "idle" | "pending" | "failed";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState<LogoutStatus>("idle");

  async function logout() {
    if (status === "pending") {
      return;
    }
    setStatus("pending");
    try {
      await logoutAccount();
    } catch (error) {
      if (getApiError(error)?.code !== API_ERROR_CODES.unauthorized) {
        setStatus("failed");
        return;
      }
    }
    queryClient.clear();
    await navigate({ to: "/login" });
  }

  return {
    logout,
    isPending: status === "pending",
    isFailed: status === "failed",
  };
}
