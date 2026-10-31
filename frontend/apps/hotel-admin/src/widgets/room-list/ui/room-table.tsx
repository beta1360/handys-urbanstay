import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { ROOM_FIELD_LABELS, ROOM_STATUS_LABELS, RoomFloor } from "@/entities/room";
import type { Room } from "@/shared/api";

const ROOM_COLUMNS: readonly TableColumn<Room>[] = [
  {
    key: "name",
    header: ROOM_FIELD_LABELS.name,
    cell: (room) => (
      <TextLink to="/rooms/$roomId" params={{ roomId: room.id }}>
        {room.name}
      </TextLink>
    ),
  },
  {
    key: "type",
    header: ROOM_FIELD_LABELS.type,
    cell: (room) => room.type,
  },
  {
    key: "floor",
    header: ROOM_FIELD_LABELS.floor,
    cell: (room) => <RoomFloor floor={room.floor} />,
  },
  {
    key: "capacity",
    header: ROOM_FIELD_LABELS.capacity,
    cell: (room) => room.capacity,
  },
  {
    key: "status",
    header: ROOM_FIELD_LABELS.status,
    cell: (room) => ROOM_STATUS_LABELS[room.status],
  },
];

function getRoomKey(room: Room) {
  return room.id;
}

type RoomTableProps = {
  rooms: readonly Room[];
  isUpdating: boolean;
};

export function RoomTable({ rooms, isUpdating }: RoomTableProps) {
  return (
    <Table
      columns={ROOM_COLUMNS}
      rows={rooms}
      getRowKey={getRoomKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
