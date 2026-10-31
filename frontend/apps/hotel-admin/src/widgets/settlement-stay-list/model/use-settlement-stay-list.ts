import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  isBeyondLastPage,
  isRequestablePage,
  SETTLEMENT_STAY_LIST_FIRST_PAGE,
  toApiPage,
  useSettlementStayListQuery,
} from "@/entities/settlement";
import type { SettlementStay } from "@/shared/api";

export type SettlementStayListCriteria = {
  month: string;
  page: number;
};

export type SettlementStayListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type SettlementStayListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      stays: readonly SettlementStay[];
      isUpdating: boolean;
      pagination: SettlementStayListPaginationState;
    };

export function useSettlementStayList({
  month,
  page,
}: SettlementStayListCriteria): SettlementStayListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } =
    useSettlementStayListQuery({ month, page: toApiPage(page) });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/settlements",
        search: { month, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, month, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/settlements", search: { month, page: nextPage } });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return { status: "empty" };
  }
  return {
    status: "ready",
    stays: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > SETTLEMENT_STAY_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
