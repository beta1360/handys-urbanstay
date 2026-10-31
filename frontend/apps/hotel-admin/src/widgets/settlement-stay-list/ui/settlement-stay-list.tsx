import { SettlementLoading } from "@/entities/settlement";
import { useSettlementStayList } from "../model/use-settlement-stay-list";
import type { SettlementStayListCriteria } from "../model/use-settlement-stay-list";
import { SettlementStayListEmpty } from "./settlement-stay-list-empty";
import { SettlementStayListLoadFailed } from "./settlement-stay-list-load-failed";
import { SettlementStayListPagination } from "./settlement-stay-list-pagination";
import { SettlementStayTable } from "./settlement-stay-table";

export function SettlementStayList({ month, page }: SettlementStayListCriteria) {
  const state = useSettlementStayList({ month, page });

  switch (state.status) {
    case "loading":
      return <SettlementLoading />;
    case "failed":
      return <SettlementStayListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <SettlementStayListEmpty />;
    case "ready":
      return (
        <>
          <SettlementStayTable
            stays={state.stays}
            isUpdating={state.isUpdating}
          />
          <SettlementStayListPagination {...state.pagination} />
        </>
      );
  }
}
