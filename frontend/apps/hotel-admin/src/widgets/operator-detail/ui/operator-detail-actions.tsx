import { TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

export function OperatorDetailActions() {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink
        to="/operators"
        activeOptions={{ exact: true }}
        className="text-sm"
      >
        {COMMON_MESSAGES.backToList}
      </TextLink>
    </div>
  );
}
