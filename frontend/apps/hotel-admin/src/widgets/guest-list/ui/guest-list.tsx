import { GuestLoading } from "@/entities/guest";
import { useGuestList } from "../model/use-guest-list";
import type { GuestListCriteria } from "../model/use-guest-list";
import { GuestListEmpty } from "./guest-list-empty";
import { GuestListLoadFailed } from "./guest-list-load-failed";
import { GuestListPagination } from "./guest-list-pagination";
import { GuestTable } from "./guest-table";

export function GuestList({ keyword, page }: GuestListCriteria) {
  const state = useGuestList({ keyword, page });

  switch (state.status) {
    case "loading":
      return <GuestLoading />;
    case "failed":
      return <GuestListLoadFailed onRetry={state.retry} />;
    case "empty":
      return <GuestListEmpty hasKeyword={state.hasKeyword} />;
    case "ready":
      return (
        <>
          <GuestTable guests={state.guests} isUpdating={state.isUpdating} />
          <GuestListPagination {...state.pagination} />
        </>
      );
  }
}
