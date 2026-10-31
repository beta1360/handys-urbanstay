import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { SETTLEMENT_STAY_LIST_MESSAGES } from "../config/messages";

type SettlementStayListLoadFailedProps = {
  onRetry: () => void;
};

export function SettlementStayListLoadFailed({
  onRetry,
}: SettlementStayListLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {SETTLEMENT_STAY_LIST_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
