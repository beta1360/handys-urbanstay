import { Button } from "@repo/ui/button";
import { COMMON_MESSAGES } from "@/shared/config";
import { HOTEL_MASTER_LOAD_MESSAGES } from "../config/messages";

type HotelMasterLoadFailedProps = {
  onRetry: () => void;
};

export function HotelMasterLoadFailed({ onRetry }: HotelMasterLoadFailedProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p role="alert" className="text-sm text-neutral-700">
        {HOTEL_MASTER_LOAD_MESSAGES.loadFailed}
      </p>
      <Button variant="secondary" onClick={onRetry}>
        {COMMON_MESSAGES.retry}
      </Button>
    </div>
  );
}
