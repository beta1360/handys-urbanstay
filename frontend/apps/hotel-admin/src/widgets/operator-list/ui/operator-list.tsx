import { OperatorLoading } from "@/entities/operator";
import { useOperatorList } from "../model/use-operator-list";
import type { OperatorListCriteria } from "../model/use-operator-list";
import { OperatorListEmpty } from "./operator-list-empty";
import { OperatorListLoadFailed } from "./operator-list-load-failed";
import { OperatorListPagination } from "./operator-list-pagination";
import { OperatorTable } from "./operator-table";

export function OperatorList({ keyword, active, page }: OperatorListCriteria) {
  const state = useOperatorList({ keyword, active, page });

  switch (state.status) {
    case "loading":
      return <OperatorLoading />;
    case "failed":
      return <OperatorListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <OperatorListEmpty isFiltered={state.isFiltered} />;
    case "ready":
      return (
        <>
          <OperatorTable
            operators={state.operators}
            isUpdating={state.isUpdating}
          />
          <OperatorListPagination {...state.pagination} />
        </>
      );
  }
}
