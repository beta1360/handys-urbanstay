import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { MEMBER_LIST_CONTENT_MESSAGES } from "../config/messages";

type MemberListEmptyProps = {
  hasKeyword: boolean;
};

export function MemberListEmpty({ hasKeyword }: MemberListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {hasKeyword
          ? COMMON_MESSAGES.emptySearchResult
          : MEMBER_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
