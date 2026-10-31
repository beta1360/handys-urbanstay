import Link from "next/link";
import { ROUTES } from "@/shared/config";
import { HOTEL_LIST_MESSAGES } from "../config/messages";
import type { HotelListItem } from "../model/load-hotel-list";

type HotelListViewProps = {
  hotels: HotelListItem[];
};

type HotelCardProps = {
  hotel: HotelListItem;
};

const HOTEL_CARD_CLASS_NAME = "flex flex-col gap-1 rounded-2xl border p-4";

function BookableHotelCard({ hotel }: HotelCardProps) {
  return (
    <Link
      href={ROUTES.hotelRooms(hotel.id)}
      className={`${HOTEL_CARD_CLASS_NAME} border-gray-200 bg-white hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900`}
    >
      <span className="font-semibold text-gray-900">{hotel.name}</span>
      <span className="text-sm text-gray-500">{hotel.address}</span>
    </Link>
  );
}

function UnbookableHotelCard({ hotel }: HotelCardProps) {
  return (
    <div className={`${HOTEL_CARD_CLASS_NAME} border-gray-100 bg-gray-50`}>
      <span className="font-semibold text-gray-500">{hotel.name}</span>
      <span className="text-sm text-gray-400">{hotel.address}</span>
      <span className="text-sm font-medium text-gray-600">
        {HOTEL_LIST_MESSAGES.noRooms}
      </span>
    </div>
  );
}

export function HotelListView({ hotels }: HotelListViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {hotels.map((hotel) => (
        <li key={hotel.id}>
          {hotel.bookable ? (
            <BookableHotelCard hotel={hotel} />
          ) : (
            <UnbookableHotelCard hotel={hotel} />
          )}
        </li>
      ))}
    </ul>
  );
}
