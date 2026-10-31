import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import { TextLink } from "@repo/admin-kit/link";
import { GUEST_FIELD_LABELS } from "@/entities/guest";
import type { Guest } from "@/shared/api";

const GUEST_COLUMNS: readonly TableColumn<Guest>[] = [
  {
    key: "name",
    header: GUEST_FIELD_LABELS.name,
    cell: (guest) => (
      <TextLink to="/guests/$guestId" params={{ guestId: guest.id }}>
        {guest.name}
      </TextLink>
    ),
  },
  {
    key: "phone",
    header: GUEST_FIELD_LABELS.phone,
    cell: (guest) => guest.phone,
  },
  {
    key: "email",
    header: GUEST_FIELD_LABELS.email,
    cell: (guest) => guest.email,
  },
];

function getGuestKey(guest: Guest) {
  return guest.id;
}

type GuestTableProps = {
  guests: readonly Guest[];
  isUpdating: boolean;
};

export function GuestTable({ guests, isUpdating }: GuestTableProps) {
  return (
    <Table
      columns={GUEST_COLUMNS}
      rows={guests}
      getRowKey={getGuestKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
