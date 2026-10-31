import { getRouteApi } from "@tanstack/react-router";
import { RoomNotFound } from "@/entities/room";
import { RoomUpdate } from "@/features/room-update";

const roomRoute = getRouteApi("/_authenticated/rooms/$roomId");

export function RoomEditPage() {
  const { roomId } = roomRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {roomId === undefined ? <RoomNotFound /> : <RoomUpdate roomId={roomId} />}
    </div>
  );
}
