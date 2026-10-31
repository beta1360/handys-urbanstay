import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { STAY_CANCELED_LABELS, STAY_FIELD_LABELS } from "@/entities/stay";
import type { Stay } from "@/shared/api";
import { STAY_LIST_CONTENT_MESSAGES } from "../config/messages";

const STAY_COLUMNS: readonly TableColumn<Stay>[] = [
  {
    key: "room",
    header: STAY_FIELD_LABELS.room,
    cell: (stay) => stay.room.name,
  },
  {
    key: "guest",
    header: STAY_FIELD_LABELS.guest,
    cell: (stay) => (
      <div className="flex flex-col">
        <span>{stay.guest.name}</span>
        <span className="text-neutral-500">{stay.guest.phone}</span>
      </div>
    ),
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
    key: "guestCount",
    header: STAY_FIELD_LABELS.guestCount,
    cell: (stay) => stay.guestCount,
  },
  {
    key: "canceled",
    header: STAY_FIELD_LABELS.canceled,
    cell: (stay) =>
      stay.cancellation === null ? null : STAY_CANCELED_LABELS.true,
  },
  {
    key: "detail",
    header: STAY_LIST_CONTENT_MESSAGES.detailHeader,
    cell: (stay) => (
      <TextLink to="/stays/$stayId" params={{ stayId: stay.id }}>
        {STAY_LIST_CONTENT_MESSAGES.detailLink}
      </TextLink>
    ),
  },
];

function getStayKey(stay: Stay) {
  return stay.id;
}

type StayTableProps = {
  stays: readonly Stay[];
  isUpdating: boolean;
};

export function StayTable({ stays, isUpdating }: StayTableProps) {
  return (
    <Table
      columns={STAY_COLUMNS}
      rows={stays}
      getRowKey={getStayKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
