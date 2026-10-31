import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import {
  ROOM_FIELD_LABELS,
  ROOM_STATUS_LABELS,
  RoomFloor,
} from "@/entities/room";
import type { HotelRoom } from "@/shared/api";

const HOTEL_ROOM_COLUMNS: readonly TableColumn<HotelRoom>[] = [
  {
    key: "name",
    header: ROOM_FIELD_LABELS.name,
    cell: (room) => room.name,
  },
  {
    key: "type",
    header: ROOM_FIELD_LABELS.type,
    cell: (room) => room.roomType.name,
  },
  {
    key: "floor",
    header: ROOM_FIELD_LABELS.floor,
    cell: (room) => <RoomFloor floor={room.floor} />,
  },
  {
    key: "status",
    header: ROOM_FIELD_LABELS.status,
    cell: (room) => ROOM_STATUS_LABELS[room.status],
  },
];

function getHotelRoomKey(room: HotelRoom) {
  return room.id;
}

type HotelRoomTableProps = {
  rooms: readonly HotelRoom[];
  isUpdating: boolean;
};

export function HotelRoomTable({ rooms, isUpdating }: HotelRoomTableProps) {
  return (
    <Table
      columns={HOTEL_ROOM_COLUMNS}
      rows={rooms}
      getRowKey={getHotelRoomKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
