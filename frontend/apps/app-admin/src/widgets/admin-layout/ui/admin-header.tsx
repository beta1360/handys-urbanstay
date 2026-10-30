import { Button } from "@repo/ui/button";
import { useMe } from "@/entities/account";
import { ADMIN_LAYOUT_MESSAGES } from "../config/messages";
import { useCurrentTitle } from "../model/use-current-title";
import { useLogout } from "../model/use-logout";

export function AdminHeader() {
  const currentTitle = useCurrentTitle();
  const { data: account } = useMe();
  const { logout, isPending, isFailed } = useLogout();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-neutral-200 bg-white px-6">
      {currentTitle ? (
        <h1 className="text-lg font-semibold text-neutral-900">
          {currentTitle}
        </h1>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {account ? (
          <span className="text-sm text-neutral-700">{account.name}</span>
        ) : null}
        {isFailed ? (
          <p role="alert" className="text-sm text-red-600">
            {ADMIN_LAYOUT_MESSAGES.logoutFailed}
          </p>
        ) : null}
        <Button variant="secondary" loading={isPending} onClick={logout}>
          {ADMIN_LAYOUT_MESSAGES.logout}
        </Button>
      </div>
    </header>
  );
}
