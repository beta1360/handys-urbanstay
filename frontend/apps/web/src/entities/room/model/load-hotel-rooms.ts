import { notFound } from "next/navigation";
import { API_ERROR_CODES, getApiError } from "@/shared/api";
import type { Room } from "@/shared/api";
import { getHotelRoomList } from "../api/hotel-room-list";
import { parseHotelId, parseRoomId } from "./room-path-params";

export type HotelRoomsState =
  | { status: "empty" }
  | { status: "ready"; hotelId: number; rooms: Room[] };

async function getRoomsOrNotFound(hotelIdParam: string) {
  const hotelId = parseHotelId(hotelIdParam);
  if (hotelId === undefined) {
    notFound();
  }
  try {
    const { items } = await getHotelRoomList(hotelId);
    return { hotelId, rooms: items };
  } catch (error) {
    if (getApiError(error)?.code === API_ERROR_CODES.hotelNotFound) {
      notFound();
    }
    throw error;
  }
}

export async function loadHotelRooms(
  hotelIdParam: string,
): Promise<HotelRoomsState> {
  const { hotelId, rooms } = await getRoomsOrNotFound(hotelIdParam);
  return rooms.length === 0
    ? { status: "empty" }
    : { status: "ready", hotelId, rooms };
}

export async function loadHotelRoom(
  hotelIdParam: string,
  roomIdParam: string,
): Promise<Room> {
  const roomId = parseRoomId(roomIdParam);
  if (roomId === undefined) {
    notFound();
  }
  const { rooms } = await getRoomsOrNotFound(hotelIdParam);
  const room = rooms.find(({ id }) => id === roomId);
  if (room === undefined) {
    notFound();
  }
  return room;
}
