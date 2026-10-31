import { useStaySearchForm } from "../model/use-stay-search-form";
import type { StaySearchCriteria } from "../model/use-stay-search-form";
import { StaySearchFormView } from "./stay-search-form-view";

export function StaySearchForm({
  roomId,
  canceled,
  guestId,
}: StaySearchCriteria) {
  const { fields, roomOptions, roomHint, handleSubmit } = useStaySearchForm({
    roomId,
    canceled,
    guestId,
  });

  return (
    <StaySearchFormView
      fields={fields}
      roomOptions={roomOptions}
      roomHint={roomHint}
      onSubmit={handleSubmit}
    />
  );
}
