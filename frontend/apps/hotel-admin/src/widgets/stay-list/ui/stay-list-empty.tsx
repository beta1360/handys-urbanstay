import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { STAY_LIST_CONTENT_MESSAGES } from "../config/messages";

type StayListEmptyProps = {
  isFiltered: boolean;
};

export function StayListEmpty({ isFiltered }: StayListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {isFiltered
          ? COMMON_MESSAGES.emptySearchResult
          : STAY_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
