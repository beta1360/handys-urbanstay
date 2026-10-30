import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { ButtonLink } from "@/shared/ui";
import { HOTEL_NOT_FOUND_MESSAGES } from "../config/messages";

export function HotelNotFound() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {HOTEL_NOT_FOUND_MESSAGES.description}
        </p>
        <ButtonLink
          to="/hotels"
          activeOptions={{ exact: true }}
          variant="secondary"
        >
          {COMMON_MESSAGES.backToList}
        </ButtonLink>
      </div>
    </Card>
  );
}
