import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { HOTEL_LIST_CONTENT_MESSAGES } from "../config/messages";

type HotelListEmptyProps = {
  hasKeyword: boolean;
};

export function HotelListEmpty({ hasKeyword }: HotelListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {hasKeyword
          ? COMMON_MESSAGES.emptySearchResult
          : HOTEL_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
