import { ButtonLink, TextLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

type HotelDetailActionsProps = {
  editHotelId?: number;
};

export function HotelDetailActions({ editHotelId }: HotelDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/hotels" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {editHotelId === undefined ? null : (
        <ButtonLink
          to="/hotels/$hotelId/edit"
          params={{ hotelId: editHotelId }}
          variant="primary"
        >
          {COMMON_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}
