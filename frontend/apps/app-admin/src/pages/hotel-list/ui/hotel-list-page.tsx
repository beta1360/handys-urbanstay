import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Pagination } from "@repo/ui/pagination";
import { HOTEL_LIST_MESSAGES } from "../config/messages";
import { useHotelList } from "../model/use-hotel-list";
import { HotelSearchForm } from "./hotel-search-form";
import { HotelTable } from "./hotel-table";

type HotelListContentProps = ReturnType<typeof useHotelList>;

function HotelListContent({
  keyword,
  page,
  hotelPage,
  isLoadFailed,
  isUpdating,
  hasPrevious,
  hasNext,
  goToPreviousPage,
  goToNextPage,
  retry,
}: HotelListContentProps) {
  if (hotelPage === undefined) {
    return isLoadFailed ? (
      <Card>
        <div className="flex flex-col items-center gap-4">
          <p role="alert" className="text-sm text-neutral-700">
            {HOTEL_LIST_MESSAGES.loadFailed}
          </p>
          <Button variant="secondary" onClick={retry}>
            {HOTEL_LIST_MESSAGES.retry}
          </Button>
        </div>
      </Card>
    ) : (
      <Card>
        <p role="status" className="text-center text-sm text-neutral-500">
          {HOTEL_LIST_MESSAGES.loading}
        </p>
      </Card>
    );
  }

  return (
    <>
      {hotelPage.items.length > 0 ? (
        <HotelTable hotels={hotelPage.items} isUpdating={isUpdating} />
      ) : (
        <Card>
          <p className="text-center text-sm text-neutral-500">
            {keyword === undefined
              ? HOTEL_LIST_MESSAGES.empty
              : HOTEL_LIST_MESSAGES.emptySearchResult}
          </p>
        </Card>
      )}
      {hotelPage.totalPages > 0 ? (
        <Pagination
          aria-label={HOTEL_LIST_MESSAGES.paginationLabel}
          status={HOTEL_LIST_MESSAGES.pageStatus(page, hotelPage.totalPages)}
          previousLabel={HOTEL_LIST_MESSAGES.previousPage}
          nextLabel={HOTEL_LIST_MESSAGES.nextPage}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={goToPreviousPage}
          onNext={goToNextPage}
        />
      ) : null}
    </>
  );
}

export function HotelListPage() {
  const list = useHotelList();

  return (
    <div className="flex flex-col gap-4">
      <HotelSearchForm keyword={list.keyword} onSearch={list.searchKeyword} />
      <HotelListContent {...list} />
    </div>
  );
}
