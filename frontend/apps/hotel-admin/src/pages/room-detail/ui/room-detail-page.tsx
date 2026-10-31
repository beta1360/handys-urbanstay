import { getRouteApi } from "@tanstack/react-router";
import { RoomNotFound } from "@/entities/room";
import { RoomDetail } from "@/widgets/room-detail";

const roomDetailRoute = getRouteApi("/_authenticated/rooms/$roomId");

export function RoomDetailPage() {
  const { roomId } = roomDetailRoute.useParams();
  const { isMaster } = roomDetailRoute.useRouteContext();

  return (
    <div className="flex flex-col gap-4">
      {roomId === undefined ? (
        <RoomNotFound />
      ) : (
        <RoomDetail roomId={roomId} canEdit={isMaster} />
      )}
    </div>
  );
}
