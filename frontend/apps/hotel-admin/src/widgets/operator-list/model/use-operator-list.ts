import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  isBeyondLastPage,
  isRequestablePage,
  OPERATOR_LIST_FIRST_PAGE,
  toApiPage,
  useOperatorListQuery,
} from "@/entities/operator";
import type { Operator } from "@/shared/api";

export type OperatorListCriteria = {
  keyword: string | undefined;
  active: boolean | undefined;
  page: number;
};

export type OperatorListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type OperatorListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty"; isFiltered: boolean }
  | {
      status: "ready";
      operators: readonly Operator[];
      isUpdating: boolean;
      pagination: OperatorListPaginationState;
    };

export function useOperatorList({
  keyword,
  active,
  page,
}: OperatorListCriteria): OperatorListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useOperatorListQuery({
    keyword,
    active,
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/operators",
        search: { keyword, active, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, keyword, active, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({
      to: "/operators",
      search: { keyword, active, page: nextPage },
    });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return {
      status: "empty",
      isFiltered: keyword !== undefined || active !== undefined,
    };
  }
  return {
    status: "ready",
    operators: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > OPERATOR_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
