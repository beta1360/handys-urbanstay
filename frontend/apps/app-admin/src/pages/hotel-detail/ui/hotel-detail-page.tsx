import { getRouteApi, Link } from "@tanstack/react-router";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import {
  DescriptionList,
  DescriptionListItem,
} from "@repo/ui/description-list";
import type { Hotel } from "@/shared/api";
import { HOTEL_DETAIL_MESSAGES } from "../config/messages";
import { useHotelDetail } from "../model/use-hotel-detail";
import { HotelNotFound } from "./hotel-not-found";

const hotelDetailRoute = getRouteApi("/_authenticated/hotels/$hotelId");

const BACK_LINK_CLASS_NAME =
  "rounded-sm text-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

function BackToListLink() {
  return (
    <div className="flex items-center">
      <Link
        to="/hotels"
        activeOptions={{ exact: true }}
        className={BACK_LINK_CLASS_NAME}
      >
        {HOTEL_DETAIL_MESSAGES.backToList}
      </Link>
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

type HotelDetailStateProps = ReturnType<typeof useHotelDetail>;

function HotelDetailState({
  hotel,
  isLoadFailed,
  retry,
}: HotelDetailStateProps) {
  if (hotel !== undefined) {
    return <HotelInformation hotel={hotel} />;
  }
  return isLoadFailed ? (
    <Card>
      <div className="flex flex-col items-center gap-4">
        <p role="alert" className="text-sm text-neutral-700">
          {HOTEL_DETAIL_MESSAGES.loadFailed}
        </p>
        <Button variant="secondary" onClick={retry}>
          {HOTEL_DETAIL_MESSAGES.retry}
        </Button>
      </div>
    </Card>
  ) : (
    <Card>
      <p role="status" className="text-center text-sm text-neutral-500">
        {HOTEL_DETAIL_MESSAGES.loading}
      </p>
    </Card>
  );
}

function HotelDetailContent({ hotelId }: { hotelId: number }) {
  const detail = useHotelDetail(hotelId);

  if (detail.hotel === undefined && detail.isNotFound) {
    return <HotelNotFound />;
  }
  return (
    <>
      <BackToListLink />
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
