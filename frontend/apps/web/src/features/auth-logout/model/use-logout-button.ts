import { useRouter } from "next/navigation";
import { useLogout } from "../api/use-logout";

export function useLogoutButton() {
  const { logout, isPending } = useLogout();
  const router = useRouter();

  function handleLogout() {
    if (isPending) {
      return;
    }
    logout(undefined, { onSuccess: () => router.refresh() });
  }

  return { isPending, handleLogout };
}
