import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Hotel } from "@/shared/api";
import {
  HOTEL_FIELD_LABELS,
  HOTEL_INFORMATION_MESSAGES,
} from "../config/messages";

type HotelInformationProps = {
  hotel: Hotel;
};

export function HotelInformation({ hotel }: HotelInformationProps) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={HOTEL_FIELD_LABELS.name}>
          {hotel.name}
        </DescriptionListItem>
        <DescriptionListItem term={HOTEL_FIELD_LABELS.address}>
          {hotel.address}
        </DescriptionListItem>
        <DescriptionListItem term={HOTEL_FIELD_LABELS.phone}>
          {hotel.phone}
        </DescriptionListItem>
        <DescriptionListItem term={HOTEL_FIELD_LABELS.description}>
          {hotel.description ?? (
            <span className="text-neutral-500">
              {HOTEL_INFORMATION_MESSAGES.emptyDescription}
            </span>
          )}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}
