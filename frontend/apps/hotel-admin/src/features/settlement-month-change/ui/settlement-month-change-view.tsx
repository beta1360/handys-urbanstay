import { Button } from "@repo/ui/button";
import { SETTLEMENT_MONTH_CHANGE_MESSAGES } from "../config/messages";

type SettlementMonthChangeViewProps = {
  monthLabel: string;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export function SettlementMonthChangeView({
  monthLabel,
  onPreviousMonth,
  onNextMonth,
}: SettlementMonthChangeViewProps) {
  return (
    <div className="flex items-center gap-4">
      <Button variant="secondary" onClick={onPreviousMonth}>
        {SETTLEMENT_MONTH_CHANGE_MESSAGES.previousMonth}
      </Button>
      <h2 className="text-lg font-semibold text-neutral-900">{monthLabel}</h2>
      <Button variant="secondary" onClick={onNextMonth}>
        {SETTLEMENT_MONTH_CHANGE_MESSAGES.nextMonth}
      </Button>
    </div>
  );
}
