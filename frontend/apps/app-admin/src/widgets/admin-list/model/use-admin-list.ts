import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ADMIN_LIST_FIRST_PAGE,
  getLastPage,
  isBeyondLastPage,
  isRequestablePage,
  toApiPage,
  useAdminListQuery,
} from "@/entities/admin";
import type { AdminSummary } from "@/shared/api";

export type AdminListCriteria = {
  page: number;
};

export type AdminListPaginationState = {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
};

export type AdminListState =
  | { status: "loading" }
  | { status: "failed"; retry: () => void }
  | { status: "empty" }
  | {
      status: "ready";
      admins: readonly AdminSummary[];
      isUpdating: boolean;
      pagination: AdminListPaginationState;
    };

export function useAdminList({ page }: AdminListCriteria): AdminListState {
  const navigate = useNavigate();
  const { data, isError, isPlaceholderData, refetch } = useAdminListQuery({
    page: toApiPage(page),
  });
  const isOverflow = data !== undefined && isBeyondLastPage(data);
  const totalPages = data?.totalPages ?? 0;
  const lastPage = getLastPage(totalPages);

  useEffect(() => {
    if (isOverflow) {
      void navigate({
        to: "/admins",
        search: { page: lastPage },
        replace: true,
      });
    }
  }, [isOverflow, lastPage, navigate]);

  function moveTo(nextPage: number) {
    void navigate({ to: "/admins", search: { page: nextPage } });
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
    admins: data.items,
    isUpdating: isPlaceholderData,
    pagination: {
      page,
      totalPages,
      hasPrevious: page > ADMIN_LIST_FIRST_PAGE,
      hasNext: page < totalPages && isRequestablePage(page + 1),
      goToPreviousPage: () => moveTo(page - 1),
      goToNextPage: () => moveTo(page + 1),
    },
  };
}
