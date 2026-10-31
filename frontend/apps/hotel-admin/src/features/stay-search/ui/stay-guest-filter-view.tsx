import { TextLink } from "@repo/admin-kit/link";
import { STAY_FIELD_LABELS } from "@/entities/stay";
import type { StayListFilter } from "@/entities/stay";
import { STAY_SEARCH_FORM_MESSAGES } from "../config/messages";

type StayGuestFilterViewProps = {
  guest: string;
  otherFilter: Omit<StayListFilter, "guestId">;
};

export function StayGuestFilterView({
  guest,
  otherFilter,
}: StayGuestFilterViewProps) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <p className="text-neutral-700">
        {STAY_FIELD_LABELS.guest}:{" "}
        <span className="font-medium text-neutral-900">{guest}</span>
      </p>
      <TextLink to="/stays" search={otherFilter}>
        {STAY_SEARCH_FORM_MESSAGES.clearGuestFilter}
      </TextLink>
    </div>
  );
}
