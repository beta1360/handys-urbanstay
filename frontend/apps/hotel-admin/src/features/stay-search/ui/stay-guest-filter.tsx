import { useStayGuestFilter } from "../model/use-stay-guest-filter";
import { StayGuestFilterView } from "./stay-guest-filter-view";

type StayGuestFilterProps = {
  guestId: number;
  roomId: number | undefined;
  canceled: boolean | undefined;
};

export function StayGuestFilter({
  guestId,
  roomId,
  canceled,
}: StayGuestFilterProps) {
  const guest = useStayGuestFilter(guestId);

  return (
    <StayGuestFilterView guest={guest} roomId={roomId} canceled={canceled} />
  );
}
