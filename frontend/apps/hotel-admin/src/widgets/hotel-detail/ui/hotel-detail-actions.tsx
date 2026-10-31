import { ButtonLink } from "@repo/admin-kit/link";
import { COMMON_MESSAGES } from "@/shared/config";

type HotelDetailActionsProps = {
  canEdit?: boolean;
};

export function HotelDetailActions({
  canEdit = false,
}: HotelDetailActionsProps) {
  return (
    <div className="flex min-h-10 items-center justify-end gap-4">
      {canEdit ? (
        <ButtonLink to="/hotel/edit" variant="primary">
          {COMMON_MESSAGES.edit}
        </ButtonLink>
      ) : null}
    </div>
  );
}
