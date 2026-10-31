import { Pagination } from "@repo/ui/pagination";
import { COMMON_MESSAGES } from "@/shared/config";
import type { SettlementStayListPaginationState } from "../model/use-settlement-stay-list";

export function SettlementStayListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
}: SettlementStayListPaginationState) {
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
