import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { SETTLEMENT_SUMMARY_MESSAGES } from "../config/messages";

type SettlementSummaryLoadFailedProps = {
  onRetry: () => void;
};

export function SettlementSummaryLoadFailed({
  onRetry,
}: SettlementSummaryLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {SETTLEMENT_SUMMARY_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
