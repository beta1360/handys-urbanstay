import { Card } from "@repo/ui/card";
import { DescriptionList, DescriptionListItem } from "@repo/ui/description-list";
import { SETTLEMENT_FIELD_LABELS } from "@/entities/settlement";
import type { Settlement } from "@/shared/api";
import { formatWon } from "@/shared/lib/money";

type SettlementSummaryContentProps = {
  settlement: Settlement;
};

export function SettlementSummaryContent({
  settlement,
}: SettlementSummaryContentProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={SETTLEMENT_FIELD_LABELS.totalAmount}>
          {formatWon(settlement.totalAmount)}
        </DescriptionListItem>
        <DescriptionListItem term={SETTLEMENT_FIELD_LABELS.stayCount}>
          {settlement.stayCount}
        </DescriptionListItem>
        <DescriptionListItem term={SETTLEMENT_FIELD_LABELS.canceledCount}>
          {settlement.canceledCount}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
