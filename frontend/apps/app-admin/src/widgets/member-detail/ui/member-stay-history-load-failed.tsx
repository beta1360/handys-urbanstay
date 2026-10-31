import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { MEMBER_STAY_HISTORY_MESSAGES } from "../config/messages";

type MemberStayHistoryLoadFailedProps = {
  onRetry: () => void;
};

export function MemberStayHistoryLoadFailed({
  onRetry,
}: MemberStayHistoryLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {MEMBER_STAY_HISTORY_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
