import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { ROOM_FIELD_LABELS } from "@/entities/room";
import { STAY_CANCELED_LABELS, STAY_FIELD_LABELS } from "@/entities/stay";
import type { SettlementStay } from "@/shared/api";
import { formatWon } from "@/shared/lib/money";
import { SETTLEMENT_STAY_LIST_MESSAGES } from "../config/messages";

const SETTLEMENT_STAY_COLUMNS: readonly TableColumn<SettlementStay>[] = [
  {
    key: "room",
    header: STAY_FIELD_LABELS.room,
    cell: (stay) => stay.room.name,
  },
  {
    key: "roomType",
    header: ROOM_FIELD_LABELS.roomType,
    cell: (stay) => stay.roomType.name,
  },
  {
    key: "guest",
    header: STAY_FIELD_LABELS.guest,
    cell: (stay) => stay.guest.name,
  },
  {
    key: "checkInDate",
    header: STAY_FIELD_LABELS.checkInDate,
    cell: (stay) => stay.checkInDate,
  },
  {
    key: "checkOutDate",
    header: STAY_FIELD_LABELS.checkOutDate,
    cell: (stay) => stay.checkOutDate,
  },
  {
    key: "nights",
    header: STAY_FIELD_LABELS.nights,
    cell: (stay) => stay.nights,
  },
  {
    key: "amount",
    header: STAY_FIELD_LABELS.amount,
    cell: (stay) => formatWon(stay.totalAmount),
  },
  {
    key: "canceled",
    header: STAY_FIELD_LABELS.canceled,
    cell: (stay) => (stay.canceledAt === null ? null : STAY_CANCELED_LABELS.true),
  },
  {
    key: "detail",
    header: SETTLEMENT_STAY_LIST_MESSAGES.detailHeader,
    cell: (stay) => (
      <TextLink to="/stays/$stayId" params={{ stayId: stay.id }}>
        {SETTLEMENT_STAY_LIST_MESSAGES.detailLink}
      </TextLink>
    ),
  },
];

function getSettlementStayKey(stay: SettlementStay) {
  return stay.id;
}

type SettlementStayTableProps = {
  stays: readonly SettlementStay[];
  isUpdating: boolean;
};

export function SettlementStayTable({
  stays,
  isUpdating,
}: SettlementStayTableProps) {
  return (
    <Table
      columns={SETTLEMENT_STAY_COLUMNS}
      rows={stays}
      getRowKey={getSettlementStayKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
