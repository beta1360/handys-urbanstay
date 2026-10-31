import Link from "next/link";
import type { Hotel } from "@/shared/api";
import { ROUTES } from "@/shared/config";

type HotelListViewProps = {
  hotels: Hotel[];
};

export function HotelListView({ hotels }: HotelListViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {hotels.map((hotel) => (
        <li key={hotel.id}>
          <Link
            href={ROUTES.hotelRooms(hotel.id)}
            className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            <span className="font-semibold text-gray-900">{hotel.name}</span>
            <span className="text-sm text-gray-500">{hotel.address}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
