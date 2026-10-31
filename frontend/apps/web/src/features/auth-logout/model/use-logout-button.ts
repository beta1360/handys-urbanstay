import { useRouter } from "next/navigation";
import { getApiError } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { showToast } from "@/shared/lib/toast";
import { useLogout } from "../api/use-logout";

export function useLogoutButton() {
  const { logout, isPending } = useLogout();
  const router = useRouter();

  function handleLogout() {
    if (isPending) {
      return;
    }
    logout(undefined, {
      onSuccess: (message) => {
        if (message !== undefined) {
          showToast(message);
        }
        router.refresh();
      },
      onError: (error) => {
        showToast(getApiError(error)?.message ?? COMMON_MESSAGES.requestFailed);
      },
    });
  }

  return { isPending, handleLogout };
}
