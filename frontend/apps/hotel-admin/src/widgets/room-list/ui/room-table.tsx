import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { ROOM_FIELD_LABELS, ROOM_STATUS_LABELS, RoomFloor } from "@/entities/room";
import { ROOM_TYPE_FIELD_LABELS } from "@/entities/room-type";
import type { Room } from "@/shared/api";
import { ROOM_TABLE_MESSAGES } from "../config/messages";

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
    key: "roomType",
    header: ROOM_FIELD_LABELS.roomType,
    cell: (room) => room.roomType.name,
  },
  {
    key: "floor",
    header: ROOM_FIELD_LABELS.floor,
    cell: (room) => <RoomFloor floor={room.floor} />,
  },
  {
    key: "capacity",
    header: ROOM_TYPE_FIELD_LABELS.capacity,
    cell: (room) => room.roomType.capacity,
  },
  {
    key: "status",
    header: ROOM_FIELD_LABELS.status,
    cell: (room) => ROOM_STATUS_LABELS[room.status],
  },
  {
    key: "currentGuest",
    header: ROOM_TABLE_MESSAGES.currentGuest,
    cell: (room) =>
      room.currentStay === null ? null : (
        <TextLink
          to="/guests/$guestId"
          params={{ guestId: room.currentStay.guest.id }}
        >
          {room.currentStay.guest.name}
        </TextLink>
      ),
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
