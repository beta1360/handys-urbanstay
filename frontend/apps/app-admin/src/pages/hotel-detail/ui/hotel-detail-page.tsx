import { getRouteApi } from "@tanstack/react-router";
import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import {
  HOTEL_FIELD_LABELS,
  HotelLoadState,
  HotelNotFound,
  useHotel,
} from "@/entities/hotel";
import type { Hotel } from "@/shared/api";
import { COMMON_MESSAGES } from "@/shared/config";
import { ButtonLink, TextLink } from "@/shared/ui";
import { HOTEL_DETAIL_MESSAGES } from "../config/messages";

const hotelDetailRoute = getRouteApi("/_authenticated/hotels/$hotelId");

function DetailActions({ hotel }: { hotel: Hotel | undefined }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <TextLink to="/hotels" activeOptions={{ exact: true }} className="text-sm">
        {COMMON_MESSAGES.backToList}
      </TextLink>
      {hotel === undefined ? null : (
        <ButtonLink
          to="/hotels/$hotelId/edit"
          params={{ hotelId: hotel.id }}
          variant="primary"
        >
          {HOTEL_DETAIL_MESSAGES.edit}
        </ButtonLink>
      )}
    </div>
  );
}

function HotelInformation({ hotel }: { hotel: Hotel }) {
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
              {HOTEL_DETAIL_MESSAGES.emptyDescription}
            </span>
          )}
        </DescriptionListItem>
      </DescriptionList>
    </Card>
  );
}

type HotelDetailStateProps = ReturnType<typeof useHotel>;

function HotelDetailState({
  hotel,
  isLoadFailed,
  retry,
}: HotelDetailStateProps) {
  if (hotel !== undefined) {
    return <HotelInformation hotel={hotel} />;
  }
  return <HotelLoadState isLoadFailed={isLoadFailed} onRetry={retry} />;
}

function HotelDetailContent({ hotelId }: { hotelId: number }) {
  const detail = useHotel(hotelId);

  if (detail.hotel === undefined && detail.isNotFound) {
    return <HotelNotFound />;
  }
  return (
    <>
      <DetailActions hotel={detail.hotel} />
      <HotelDetailState {...detail} />
    </>
  );
}

export function HotelDetailPage() {
  const { hotelId } = hotelDetailRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {hotelId === undefined ? (
        <HotelNotFound />
      ) : (
        <HotelDetailContent hotelId={hotelId} />
      )}
    </div>
  );
}
