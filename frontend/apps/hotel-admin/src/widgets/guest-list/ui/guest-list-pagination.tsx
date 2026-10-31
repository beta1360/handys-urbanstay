import { Pagination } from "@repo/ui/pagination";
import { GUEST_LIST_CONTENT_MESSAGES } from "../config/messages";
import type { GuestListPaginationState } from "../model/use-guest-list";

export function GuestListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
}: GuestListPaginationState) {
  return (
    <Pagination
      aria-label={GUEST_LIST_CONTENT_MESSAGES.paginationLabel}
      status={GUEST_LIST_CONTENT_MESSAGES.pageStatus(page, totalPages)}
      previousLabel={GUEST_LIST_CONTENT_MESSAGES.previousPage}
      nextLabel={GUEST_LIST_CONTENT_MESSAGES.nextPage}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      onPrevious={goToPreviousPage}
      onNext={goToNextPage}
    />
  );
}
