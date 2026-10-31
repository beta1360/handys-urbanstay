import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { GUEST_LIST_CONTENT_MESSAGES } from "../config/messages";

type GuestListLoadFailedProps = {
  onRetry: () => void;
};

export function GuestListLoadFailed({ onRetry }: GuestListLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {GUEST_LIST_CONTENT_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
