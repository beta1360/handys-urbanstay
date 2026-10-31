import { Pagination } from "@repo/ui/pagination";
import { COMMON_MESSAGES } from "@/shared/config";
import type { OperatorListPaginationState } from "../model/use-operator-list";

export function OperatorListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
}: OperatorListPaginationState) {
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
