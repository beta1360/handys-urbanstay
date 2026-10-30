import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import { HotelLoadState, HotelNotFound, useHotel } from "@/entities/hotel";
import type { Hotel } from "@/shared/api";
import { HOTEL_DETAIL_MESSAGES } from "../config/messages";

const hotelDetailRoute = getRouteApi("/_authenticated/hotels/$hotelId");

const BACK_LINK_CLASS_NAME =
  "rounded-sm text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

function EditHotelButton({ hotelId }: { hotelId: number }) {
  const navigate = useNavigate();

  return (
    <Button
      variant="primary"
      onClick={() =>
        void navigate({ to: "/hotels/$hotelId/edit", params: { hotelId } })
      }
    >
      {HOTEL_DETAIL_MESSAGES.edit}
    </Button>
  );
}

function DetailActions({ hotel }: { hotel: Hotel | undefined }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-4">
      <Link
        to="/hotels"
        activeOptions={{ exact: true }}
        className={BACK_LINK_CLASS_NAME}
      >
        {HOTEL_DETAIL_MESSAGES.backToList}
      </Link>
      {hotel === undefined ? null : <EditHotelButton hotelId={hotel.id} />}
    </div>
  );
}

function HotelInformation({ hotel }: { hotel: Hotel }) {
  return (
    <Card>
      <DescriptionList>
        <DescriptionListItem term={HOTEL_DETAIL_MESSAGES.nameLabel}>
          {hotel.name}
        </DescriptionListItem>
        <DescriptionListItem term={HOTEL_DETAIL_MESSAGES.addressLabel}>
          {hotel.address}
        </DescriptionListItem>
        <DescriptionListItem term={HOTEL_DETAIL_MESSAGES.phoneLabel}>
          {hotel.phone}
        </DescriptionListItem>
        <DescriptionListItem term={HOTEL_DETAIL_MESSAGES.descriptionLabel}>
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
