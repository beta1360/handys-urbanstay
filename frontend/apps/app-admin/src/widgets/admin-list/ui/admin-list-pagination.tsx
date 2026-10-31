import { Pagination } from "@repo/ui/pagination";
import { COMMON_MESSAGES } from "@/shared/config";
import type { AdminListPaginationState } from "../model/use-admin-list";

export function AdminListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
}: AdminListPaginationState) {
  return (
    <Pagination
      aria-label={COMMON_MESSAGES.paginationLabel}
      status={COMMON_MESSAGES.pageStatus(page, totalPages)}
      previousLabel={COMMON_MESSAGES.previousPage}
      nextLabel={COMMON_MESSAGES.nextPage}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      onPrevious={goToPreviousPage}
      onNext={goToNextPage}
    />
  );
}
