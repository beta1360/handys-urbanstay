import { useSettlementMonthChange } from "../model/use-settlement-month-change";
import { SettlementMonthChangeView } from "./settlement-month-change-view";

type SettlementMonthChangeProps = {
  month: string;
};

export function SettlementMonthChange({ month }: SettlementMonthChangeProps) {
  const { monthLabel, goToPreviousMonth, goToNextMonth } =
    useSettlementMonthChange(month);

  return (
    <SettlementMonthChangeView
      monthLabel={monthLabel}
      onPreviousMonth={goToPreviousMonth}
      onNextMonth={goToNextMonth}
    />
  );
}
