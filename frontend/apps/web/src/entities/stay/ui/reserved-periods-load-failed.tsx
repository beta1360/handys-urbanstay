import { COMMON_MESSAGES } from "@/shared/config";
import { Button } from "@/shared/ui";
import { RESERVED_PERIODS_MESSAGES } from "../config/messages";

type ReservedPeriodsLoadFailedProps = {
  onRetry: () => void;
};

export function ReservedPeriodsLoadFailed({
  onRetry,
}: ReservedPeriodsLoadFailedProps) {
  return (
    <div className="flex flex-col gap-2">
      <p role="alert" className="text-sm text-gray-700">
        {RESERVED_PERIODS_MESSAGES.loadFailed}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        {COMMON_MESSAGES.retry}
      </Button>
    </div>
  );
}
