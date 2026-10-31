import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { GUEST_LIST_CONTENT_MESSAGES } from "../config/messages";

type GuestListEmptyProps = {
  hasKeyword: boolean;
};

export function GuestListEmpty({ hasKeyword }: GuestListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {hasKeyword
          ? COMMON_MESSAGES.emptySearchResult
          : GUEST_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
