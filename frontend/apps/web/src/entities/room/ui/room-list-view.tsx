import Link from "next/link";
import type { Room } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { RoomSummary } from "./room-summary";

type RoomListViewProps = {
  hotelId: number;
  rooms: Room[];
};

export function RoomListView({ hotelId, rooms }: RoomListViewProps) {
  return (
    <ul className="flex flex-col gap-3">
      {rooms.map((room) => (
        <li key={room.id}>
          <Link
            href={ROUTES.roomBooking(hotelId, room.id)}
            className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            <RoomSummary room={room} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
