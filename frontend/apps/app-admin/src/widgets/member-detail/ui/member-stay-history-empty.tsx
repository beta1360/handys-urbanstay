import { Card } from "@repo/ui/card";
import { MEMBER_STAY_HISTORY_MESSAGES } from "../config/messages";

export function MemberStayHistoryEmpty() {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {MEMBER_STAY_HISTORY_MESSAGES.empty}
      </p>
    </Card>
  );
}
