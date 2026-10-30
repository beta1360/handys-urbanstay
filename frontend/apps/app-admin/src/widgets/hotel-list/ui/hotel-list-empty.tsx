import { Card } from "@repo/ui/card";
import { HOTEL_LIST_CONTENT_MESSAGES } from "../config/messages";

type HotelListEmptyProps = {
  hasKeyword: boolean;
};

export function HotelListEmpty({ hasKeyword }: HotelListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {hasKeyword
          ? HOTEL_LIST_CONTENT_MESSAGES.emptySearchResult
          : HOTEL_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
