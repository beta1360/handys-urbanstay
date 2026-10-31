import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { ROOM_TYPE_FIELD_LABELS } from "@/entities/room-type";
import type { RoomType } from "@/shared/api";
import { formatWon } from "@/shared/lib/money";

const ROOM_TYPE_COLUMNS: readonly TableColumn<RoomType>[] = [
  {
    key: "name",
    header: ROOM_TYPE_FIELD_LABELS.name,
    cell: (roomType) => (
      <TextLink
        to="/room-types/$roomTypeId"
        params={{ roomTypeId: roomType.id }}
      >
        {roomType.name}
      </TextLink>
    ),
  },
  {
    key: "capacity",
    header: ROOM_TYPE_FIELD_LABELS.capacity,
    cell: (roomType) => roomType.capacity,
  },
  {
    key: "roomRate",
    header: ROOM_TYPE_FIELD_LABELS.roomRate,
    cell: (roomType) => formatWon(roomType.roomRate),
  },
  {
    key: "checkInTime",
    header: ROOM_TYPE_FIELD_LABELS.checkInTime,
    cell: (roomType) => roomType.checkInTime,
  },
  {
    key: "checkOutTime",
    header: ROOM_TYPE_FIELD_LABELS.checkOutTime,
    cell: (roomType) => roomType.checkOutTime,
  },
];

function getRoomTypeKey(roomType: RoomType) {
  return roomType.id;
}

type RoomTypeTableProps = {
  roomTypes: readonly RoomType[];
};

export function RoomTypeTable({ roomTypes }: RoomTypeTableProps) {
  return (
    <Table
      columns={ROOM_TYPE_COLUMNS}
      rows={roomTypes}
      getRowKey={getRoomTypeKey}
    />
  );
}
