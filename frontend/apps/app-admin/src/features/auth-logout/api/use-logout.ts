import { useQueryClient } from "@tanstack/react-query";
import { endSession } from "@/entities/account";
import { API_ERROR_CODES, getApiError, logoutAccount } from "@/shared/api";

export function useLogout() {
  const queryClient = useQueryClient();

  async function logout() {
    try {
      await logoutAccount();
    } catch (error) {
      if (getApiError(error)?.code !== API_ERROR_CODES.unauthorized) {
        throw error;
      }
    }
    endSession(queryClient);
  }

  return { logout };
}
