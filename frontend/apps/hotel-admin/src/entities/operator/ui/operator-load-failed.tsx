import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_LOAD_MESSAGES } from "../config/messages";

type OperatorLoadFailedProps = {
  onRetry: () => void;
};

export function OperatorLoadFailed({ onRetry }: OperatorLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {OPERATOR_LOAD_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
