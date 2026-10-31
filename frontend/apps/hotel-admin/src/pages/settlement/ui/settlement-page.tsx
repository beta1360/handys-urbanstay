import { getRouteApi } from "@tanstack/react-router";
import { SettlementMonthChange } from "@/features/settlement-month-change";
import { SettlementStayList } from "@/widgets/settlement-stay-list";
import { SettlementSummary } from "@/widgets/settlement-summary";

const settlementRoute = getRouteApi("/_authenticated/settlements/");

export function SettlementPage() {
  const { month, page } = settlementRoute.useSearch();

  return (
    <div className="flex flex-col gap-4">
      <SettlementMonthChange month={month} />
      <SettlementSummary month={month} />
      <SettlementStayList month={month} page={page} />
    </div>
  );
}
