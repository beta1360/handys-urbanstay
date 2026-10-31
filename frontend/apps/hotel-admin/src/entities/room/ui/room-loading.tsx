import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";

export function RoomLoading() {
  return (
    <Card>
      <p role="status" className="text-center text-sm text-neutral-500">
        {COMMON_MESSAGES.loading}
      </p>
    </Card>
  );
}
