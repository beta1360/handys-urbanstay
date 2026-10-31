import { useState } from "react";
import {
  isRequestableStayPage,
  MEMBER_LIST_FIRST_PAGE,
  toApiPage,
  useMemberStayListQuery,
} from "@/entities/member";
import type { MemberStay } from "@/shared/api";

export type MemberStayHistoryPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type MemberStayHistoryState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      stays: readonly MemberStay[];
      isUpdating: boolean;
      pagination: MemberStayHistoryPaginationState;
    };

export function useMemberStayHistory(memberId: number): MemberStayHistoryState {
  const [page, setPage] = useState(MEMBER_LIST_FIRST_PAGE);
  const { data, isError, isPlaceholderData, refetch } = useMemberStayListQuery(
    memberId,
    { page: toApiPage(page) },
  );

  if (data === undefined) {
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
      totalPages: data.totalPages,
      hasPrevious: page > MEMBER_LIST_FIRST_PAGE,
      hasNext: page < data.totalPages && isRequestableStayPage(page + 1),
      goToPreviousPage: () => setPage(page - 1),
      goToNextPage: () => setPage(page + 1),
    },
  };
}
