import { useNavigate } from "@tanstack/react-router";
import {
  formatSettlementMonth,
  shiftSettlementMonth,
} from "@/entities/settlement";

export function useSettlementMonthChange(month: string) {
  const navigate = useNavigate();

  function moveBy(offset: number) {
    void navigate({
      to: "/settlements",
      search: { month: shiftSettlementMonth(month, offset) },
    });
  }

  return {
    monthLabel: formatSettlementMonth(month),
    goToPreviousMonth: () => moveBy(-1),
    goToNextMonth: () => moveBy(1),
  };
}
