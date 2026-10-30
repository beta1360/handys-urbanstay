import { Link } from "@tanstack/react-router";
import { Table } from "@repo/ui/table";
import type { TableColumn } from "@repo/ui/table";
import type { Hotel } from "@/shared/api";
import { HOTEL_LIST_MESSAGES } from "../config/messages";

const HOTEL_NAME_LINK_CLASS_NAME =
  "rounded-sm font-medium text-neutral-900 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900";

const HOTEL_COLUMNS: readonly TableColumn<Hotel>[] = [
  {
    key: "name",
    header: HOTEL_LIST_MESSAGES.nameColumn,
    cell: (hotel) => (
      <Link
        to="/hotels/$hotelId"
        params={{ hotelId: hotel.id }}
        className={HOTEL_NAME_LINK_CLASS_NAME}
      >
        {hotel.name}
      </Link>
    ),
  },
  {
    key: "address",
    header: HOTEL_LIST_MESSAGES.addressColumn,
    cell: (hotel) => hotel.address,
  },
  {
    key: "phone",
    header: HOTEL_LIST_MESSAGES.phoneColumn,
    cell: (hotel) => hotel.phone,
  },
];

function getHotelKey(hotel: Hotel) {
  return hotel.id;
}

type HotelTableProps = {
  hotels: readonly Hotel[];
  isUpdating: boolean;
};

export function HotelTable({ hotels, isUpdating }: HotelTableProps) {
  return (
    <Table
      columns={HOTEL_COLUMNS}
      rows={hotels}
      getRowKey={getHotelKey}
      aria-busy={isUpdating || undefined}
    />
  );
}
