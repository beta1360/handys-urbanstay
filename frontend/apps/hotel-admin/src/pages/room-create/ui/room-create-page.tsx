import { getRouteApi } from "@tanstack/react-router";
import { RoomCreateForm } from "@/features/room-create";
import { MasterForbidden } from "@/shared/ui/master-forbidden";

const roomCreateRoute = getRouteApi("/_authenticated/rooms/new");

export function RoomCreatePage() {
  const { isMaster } = roomCreateRoute.useRouteContext();

  return isMaster ? <RoomCreateForm /> : <MasterForbidden />;
}
