import type { StayListFilter } from "@/entities/stay";
import { useStayGuestFilter } from "../model/use-stay-guest-filter";
import { StayGuestFilterView } from "./stay-guest-filter-view";

type StayGuestFilterProps = StayListFilter & {
  guestId: number;
};

export function StayGuestFilter({
  guestId,
  roomId,
  canceled,
  keyword,
  checkInFrom,
  checkInTo,
}: StayGuestFilterProps) {
  const guest = useStayGuestFilter(guestId);

  return (
    <StayGuestFilterView
      guest={guest}
      otherFilter={{ roomId, canceled, keyword, checkInFrom, checkInTo }}
    />
  );
}
