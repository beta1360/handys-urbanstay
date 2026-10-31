import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { ROOM_STATUS_LABELS } from "@/entities/room";
import type { RoomStatusHistory } from "@/shared/api";
import { formatKoreanDateTime } from "@/shared/lib/date-time";
import { ROOM_STATUS_HISTORY_MESSAGES } from "../config/messages";

const ROOM_STATUS_HISTORY_COLUMNS: readonly TableColumn<RoomStatusHistory>[] = [
  {
    key: "changedAt",
    header: ROOM_STATUS_HISTORY_MESSAGES.changedAt,
    cell: (history) => (
      <time dateTime={history.changedAt}>
        {formatKoreanDateTime(history.changedAt)}
      </time>
    ),
  },
  {
    key: "statusChange",
    header: ROOM_STATUS_HISTORY_MESSAGES.statusChange,
    cell: (history) => (
      <>
        {history.fromStatus === null ? (
          <span className="text-neutral-500">
            {ROOM_STATUS_HISTORY_MESSAGES.noFromStatus}
          </span>
        ) : (
          ROOM_STATUS_LABELS[history.fromStatus]
        )}
        {ROOM_STATUS_HISTORY_MESSAGES.statusArrow}
        {ROOM_STATUS_LABELS[history.toStatus]}
      </>
    ),
  },
  {
    key: "changedBy",
    header: ROOM_STATUS_HISTORY_MESSAGES.changedBy,
    cell: (history) => history.changedBy.name,
  },
];

function getHistoryKey(history: RoomStatusHistory) {
  return history.id;
}

type RoomStatusHistoryTableProps = {
  histories: readonly RoomStatusHistory[];
  isUpdating: boolean;
};

export function RoomStatusHistoryTable({
  histories,
  isUpdating,
}: RoomStatusHistoryTableProps) {
  return (
    <Table
      columns={ROOM_STATUS_HISTORY_COLUMNS}
      rows={histories}
      getRowKey={getHistoryKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
