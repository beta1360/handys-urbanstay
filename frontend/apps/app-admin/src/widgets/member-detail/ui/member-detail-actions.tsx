import { TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

export function MemberDetailActions() {
  return (
    <div className="flex items-center">
      <TextLink
        to="/members"
        activeOptions={{ exact: true }}
        className="text-sm"
      >
        {COMMON_MESSAGES.backToList}
      </TextLink>
    </div>
  );
}
