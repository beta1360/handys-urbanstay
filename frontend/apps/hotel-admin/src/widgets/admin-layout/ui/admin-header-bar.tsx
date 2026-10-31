import { Button } from "@repo/ui/button";
import { ADMIN_LAYOUT_MESSAGES } from "../config/messages";
import type { HeaderAccount } from "../model/use-admin-header";
import type { LogoutStatus } from "../model/use-logout";

type AdminHeaderBarProps = {
  title: string | undefined;
  account: HeaderAccount | undefined;
  logoutStatus: LogoutStatus;
  onLogout: () => void;
};

export function AdminHeaderBar({
  title,
  account,
  logoutStatus,
  onLogout,
}: AdminHeaderBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-neutral-200 bg-white px-6">
      {title ? (
        <h1 className="text-lg font-semibold text-neutral-900">{title}</h1>
      ) : null}
      <div className="ml-auto flex items-center gap-3">
        {account !== undefined ? (
          <>
            <span className="text-sm font-medium text-neutral-900">
              {account.hotelName}
            </span>
            <span className="flex items-center gap-2 border-l border-neutral-200 pl-3">
              <span className="text-sm text-neutral-700">{account.name}</span>
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {account.roleLabel}
              </span>
            </span>
          </>
        ) : null}
        {logoutStatus === "failed" ? (
          <p role="alert" className="text-sm text-red-600">
            {ADMIN_LAYOUT_MESSAGES.logoutFailed}
          </p>
        ) : null}
        <Button
          variant="secondary"
          loading={logoutStatus === "pending"}
          onClick={onLogout}
        >
          {ADMIN_LAYOUT_MESSAGES.logout}
        </Button>
      </div>
    </header>
  );
}
