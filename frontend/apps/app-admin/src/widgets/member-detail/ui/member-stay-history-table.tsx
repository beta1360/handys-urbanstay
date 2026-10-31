import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { ROOM_FIELD_LABELS } from "@/entities/room";
import type { MemberStay } from "@/shared/api";
import { formatWon } from "@/shared/lib/currency";
import { MEMBER_STAY_HISTORY_MESSAGES } from "../config/messages";

const MEMBER_STAY_COLUMNS: readonly TableColumn<MemberStay>[] = [
  {
    key: "hotel",
    header: MEMBER_STAY_HISTORY_MESSAGES.hotel,
    cell: (stay) => stay.hotel.name,
  },
  {
    key: "room",
    header: ROOM_FIELD_LABELS.room,
    cell: (stay) => stay.room.name,
  },
  {
    key: "roomType",
    header: ROOM_FIELD_LABELS.type,
    cell: (stay) => stay.roomType.name,
  },
  {
    key: "period",
    header: MEMBER_STAY_HISTORY_MESSAGES.period,
    cell: (stay) =>
      MEMBER_STAY_HISTORY_MESSAGES.periodValue(
        stay.checkInDate,
        stay.checkOutDate,
        stay.nights,
      ),
  },
  {
    key: "guestCount",
    header: MEMBER_STAY_HISTORY_MESSAGES.guestCount,
    cell: (stay) => MEMBER_STAY_HISTORY_MESSAGES.guestCountValue(stay.guestCount),
  },
  {
    key: "totalAmount",
    header: MEMBER_STAY_HISTORY_MESSAGES.totalAmount,
    cell: (stay) => formatWon(stay.totalAmount),
  },
  {
    key: "canceled",
    header: MEMBER_STAY_HISTORY_MESSAGES.canceled,
    cell: (stay) =>
      stay.canceledAt === null
        ? null
        : MEMBER_STAY_HISTORY_MESSAGES.canceledValue,
  },
];

function getMemberStayKey(stay: MemberStay) {
  return stay.id;
}

type MemberStayHistoryTableProps = {
  stays: readonly MemberStay[];
  isUpdating: boolean;
};

export function MemberStayHistoryTable({
  stays,
  isUpdating,
}: MemberStayHistoryTableProps) {
  return (
    <Table
      columns={MEMBER_STAY_COLUMNS}
      rows={stays}
      getRowKey={getMemberStayKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
