import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_LIST_CONTENT_MESSAGES } from "../config/messages";

type OperatorListLoadFailedProps = {
  onRetry: () => void;
};

export function OperatorListLoadFailed({
  onRetry,
}: OperatorListLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {OPERATOR_LIST_CONTENT_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
