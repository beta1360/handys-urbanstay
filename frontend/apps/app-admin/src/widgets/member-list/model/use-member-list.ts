import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  getLastPage,
  isBeyondLastPage,
  isRequestablePage,
  MEMBER_LIST_FIRST_PAGE,
  toApiPage,
  useMemberListQuery,
} from "@/entities/member";
import type { Member } from "@/shared/api";

export type MemberListCriteria = {
  keyword: string | undefined;
  page: number;
};

export type MemberListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type MemberListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty"; hasKeyword: boolean }
  | {
      status: "ready";
      members: readonly Member[];
      isUpdating: boolean;
      pagination: MemberListPaginationState;
    };

export function useMemberList({
  keyword,
  page,
}: MemberListCriteria): MemberListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useMemberListQuery({
    keyword,
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/members",
        search: { keyword, page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, keyword, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/members", search: { keyword, page: nextPage } });
  }

  if (data === undefined || isOverflow) {
    return isError
      ? { status: "failed", retry: () => void refetch() }
      : { status: "loading" };
  }
  if (data.items.length === 0) {
    return { status: "empty", hasKeyword: keyword !== undefined };
  }
  return {
    status: "ready",
    members: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > MEMBER_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
