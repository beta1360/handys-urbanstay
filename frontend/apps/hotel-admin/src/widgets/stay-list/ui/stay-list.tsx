import { StayLoading } from "@/entities/stay";
import { useStayList } from "../model/use-stay-list";
import type { StayListCriteria } from "../model/use-stay-list";
import { StayListEmpty } from "./stay-list-empty";
import { StayListLoadFailed } from "./stay-list-load-failed";
import { StayListPagination } from "./stay-list-pagination";
import { StayTable } from "./stay-table";

export function StayList(criteria: StayListCriteria) {
  const state = useStayList(criteria);

  switch (state.status) {
    case "loading":
      return <StayLoading />;
    case "failed":
      return <StayListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <StayListEmpty isFiltered={state.isFiltered} />;
    case "ready":
      return (
        <>
          <StayTable stays={state.stays} isUpdating={state.isUpdating} />
          <StayListPagination {...state.pagination} />
        </>
      );
  }
}
