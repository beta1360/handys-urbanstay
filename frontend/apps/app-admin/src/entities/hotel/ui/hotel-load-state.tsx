import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { HOTEL_LOAD_MESSAGES } from "../config/messages";

type HotelLoadStateProps = {
  isLoadFailed: boolean;
  onRetry: () => void;
};

export function HotelLoadState({ isLoadFailed, onRetry }: HotelLoadStateProps) {
  return isLoadFailed ? (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {HOTEL_LOAD_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {COMMON_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  ) : (
    <Card>
      <p role="status" className="text-center text-sm text-neutral-500">
        {COMMON_MESSAGES.loading}
      </p>
    </Card>
  );
}
