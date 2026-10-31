import { Card } from "@repo/ui/card";
import { COMMON_MESSAGES } from "@/shared/config";
import { OPERATOR_LIST_CONTENT_MESSAGES } from "../config/messages";

type OperatorListEmptyProps = {
  isFiltered: boolean;
};

export function OperatorListEmpty({ isFiltered }: OperatorListEmptyProps) {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {isFiltered
          ? COMMON_MESSAGES.emptySearchResult
          : OPERATOR_LIST_CONTENT_MESSAGES.empty}
      </p>
    </Card>
  );
}
