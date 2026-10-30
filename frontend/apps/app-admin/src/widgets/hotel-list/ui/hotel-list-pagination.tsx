import { Pagination } from "@repo/ui/pagination";
import { HOTEL_LIST_CONTENT_MESSAGES } from "../config/messages";
import type { HotelListPaginationState } from "../model/use-hotel-list";

export function HotelListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
}: HotelListPaginationState) {
  return (
    <Pagination
      aria-label={HOTEL_LIST_CONTENT_MESSAGES.paginationLabel}
      status={HOTEL_LIST_CONTENT_MESSAGES.pageStatus(page, totalPages)}
      previousLabel={HOTEL_LIST_CONTENT_MESSAGES.previousPage}
      nextLabel={HOTEL_LIST_CONTENT_MESSAGES.nextPage}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      onPrevious={goToPreviousPage}
      onNext={goToNextPage}
    />
  );
}
