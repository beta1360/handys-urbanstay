import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { ADMIN_LIST_CONTENT_MESSAGES } from "../config/messages";

type AdminListLoadFailedProps = {
  onRetry: () => void;
};

export function AdminListLoadFailed({ onRetry }: AdminListLoadFailedProps) {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {ADMIN_LIST_CONTENT_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  );
}
