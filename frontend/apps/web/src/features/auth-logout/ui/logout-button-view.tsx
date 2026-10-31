import { LOGOUT_MESSAGES } from "../config/messages";

type LogoutButtonViewProps = {
  isPending: boolean;
  onLogout: () => void;
};

export function LogoutButtonView({
  isPending,
  onLogout,
}: LogoutButtonViewProps) {
  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className="text-sm text-gray-600 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:opacity-50"
    >
      {LOGOUT_MESSAGES.logout}
    </button>
  );
}
