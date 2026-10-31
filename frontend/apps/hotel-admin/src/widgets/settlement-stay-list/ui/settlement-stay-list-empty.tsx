import { Card } from "@repo/ui/card";
import { SETTLEMENT_STAY_LIST_MESSAGES } from "../config/messages";

export function SettlementStayListEmpty() {
  return (
    <Card>
      <p className="text-center text-sm text-neutral-500">
        {SETTLEMENT_STAY_LIST_MESSAGES.empty}
      </p>
    </Card>
  );
}
