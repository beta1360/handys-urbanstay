import { getRouteApi } from "@tanstack/react-router";
import { RoomTypeNotFound } from "@/entities/room-type";
import { RoomTypeDetail } from "@/widgets/room-type-detail";

const roomTypeRoute = getRouteApi("/_authenticated/room-types/$roomTypeId");

export function RoomTypeDetailPage() {
  const { roomTypeId } = roomTypeRoute.useParams();

  return (
    <div className="flex flex-col gap-4">
      {roomTypeId === undefined ? (
        <RoomTypeNotFound />
      ) : (
        <RoomTypeDetail roomTypeId={roomTypeId} />
      )}
    </div>
  );
}
