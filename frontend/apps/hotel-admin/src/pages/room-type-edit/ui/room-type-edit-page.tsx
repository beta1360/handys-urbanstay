import { getRouteApi } from "@tanstack/react-router";
import { RoomTypeNotFound } from "@/entities/room-type";
import { RoomTypeUpdate } from "@/features/room-type-update";

const roomTypeRoute = getRouteApi("/_authenticated/room-types/$roomTypeId");

export function RoomTypeEditPage() {
  const { roomTypeId } = roomTypeRoute.useParams();

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      {roomTypeId === undefined ? (
        <RoomTypeNotFound />
      ) : (
        <RoomTypeUpdate roomTypeId={roomTypeId} />
      )}
    </div>
  );
}
