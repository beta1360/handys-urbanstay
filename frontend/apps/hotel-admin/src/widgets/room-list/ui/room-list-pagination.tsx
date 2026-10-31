import { Pagination } from "@repo/ui/pagination";
import { ROOM_LIST_CONTENT_MESSAGES } from "../config/messages";
import type { RoomListPaginationState } from "../model/use-room-list";

export function RoomListPagination({
  page,
  totalPages,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
}: RoomListPaginationState) {
  return (
    <Pagination
      aria-label={ROOM_LIST_CONTENT_MESSAGES.paginationLabel}
      status={ROOM_LIST_CONTENT_MESSAGES.pageStatus(page, totalPages)}
      previousLabel={ROOM_LIST_CONTENT_MESSAGES.previousPage}
      nextLabel={ROOM_LIST_CONTENT_MESSAGES.nextPage}
      hasPrevious={hasPrevious}
      hasNext={hasNext}
      onPrevious={goToPreviousPage}
      onNext={goToNextPage}
    />
  );
}
